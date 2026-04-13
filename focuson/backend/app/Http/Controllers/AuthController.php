<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

/**
 * AuthController
 *
 * Handles all authentication:
 * - register: creates user, returns access+refresh tokens
 * - login: validates credentials, issues tokens
 * - logout: invalidates current token
 * - refresh: rotates access token using refresh token (in cookie)
 * - me: returns authenticated user profile
 * - updateProfile: updates user profile fields + theme preference
 *
 * Security:
 * - Passwords hashed with bcrypt (cost 12)
 * - Access token: 15 min TTL (in-memory on client)
 * - Refresh token: 7-day TTL (httpOnly cookie)
 * - Input sanitization via Validator
 */
class AuthController extends Controller
{
    /**
     * Register a new user.
     * POST /api/auth/register
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|min:2|max:100|regex:/^[\pL\s\-]+$/u',
            'email'    => 'required|email:rfc,dns|max:255|unique:users,email',
            'password' => 'required|string|min:8|max:128|confirmed',
        ], [
            'name.regex'    => 'Name may only contain letters, spaces, and hyphens.',
            'email.unique'  => 'An account with this email already exists.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name'     => strip_tags(trim($request->name)),
            'email'    => strtolower(trim($request->email)),
            'password' => Hash::make($request->password, ['rounds' => 12]),
            'role'     => 'user',
            'theme_preference' => 'system',
            'onboarding_completed' => false,
        ]);

        return $this->issueTokens($user, 201);
    }

    /**
     * Login an existing user.
     * POST /api/auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Invalid credentials'], 422);
        }

        $credentials = [
            'email'    => strtolower(trim($request->email)),
            'password' => $request->password,
        ];

        // Use short TTL for access token (15 min)
        try {
            $accessToken = JWTAuth::attempt($credentials);
        } catch (JWTException $e) {
            return response()->json(['message' => 'Could not create token'], 500);
        }

        if (!$accessToken) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $user = auth()->user();

        // Update last login timestamp
        $user->update(['last_login' => now()]);

        return $this->issueTokens($user, 200, $accessToken);
    }

    /**
     * Logout — invalidate token.
     * POST /api/auth/logout
     */
    public function logout(): JsonResponse
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
        } catch (JWTException $e) {
            // Token already invalid — that's fine
        }

        return response()->json(['message' => 'Logged out successfully'])
            ->withCookie(cookie()->forget('refresh_token'));
    }

    /**
     * Refresh access token using refresh token cookie.
     * POST /api/auth/refresh
     */
    public function refresh(Request $request): JsonResponse
    {
        $refreshToken = $request->cookie('refresh_token');

        if (!$refreshToken) {
            return response()->json(['message' => 'No refresh token'], 401);
        }

        try {
            // Decode refresh token to get user ID
            $payload  = JWTAuth::setToken($refreshToken)->getPayload();
            $userId   = $payload->get('sub');
            $user     = User::find($userId);

            if (!$user) {
                return response()->json(['message' => 'User not found'], 401);
            }

            // Issue fresh access token
            $accessToken = JWTAuth::fromUser($user);

            return $this->buildTokenResponse($user, $accessToken, 200);
        } catch (JWTException $e) {
            return response()->json(['message' => 'Invalid or expired refresh token'], 401);
        }
    }

    /**
     * Get authenticated user profile.
     * GET /api/auth/me
     */
    public function me(): JsonResponse
    {
        return response()->json([
            'user' => $this->formatUser(auth()->user())
        ]);
    }

    /**
     * Update profile + theme preference.
     * PUT /api/auth/profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'name'             => 'sometimes|string|min:2|max:100',
            'theme_preference' => 'sometimes|in:light,dark,system',
            'profile.bio'      => 'sometimes|string|max:500',
            'profile.current_role' => 'sometimes|string|max:100',
            'profile.location' => 'sometimes|string|max:100',
            'profile.skills'   => 'sometimes|array|max:20',
            'profile.skills.*' => 'string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = [];

        if ($request->has('name'))             $data['name']             = strip_tags(trim($request->name));
        if ($request->has('theme_preference')) $data['theme_preference'] = $request->theme_preference;
        if ($request->has('profile'))          $data['profile']          = $request->profile;

        $user->update($data);

        return response()->json([
            'message' => 'Profile updated',
            'user'    => $this->formatUser($user->fresh()),
        ]);
    }

    // ─────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────

    /**
     * Issue both access token (short TTL) and refresh token (long TTL).
     * Access token → returned in response body
     * Refresh token → sent as httpOnly cookie (XSS protection)
     */
    private function issueTokens(User $user, int $status = 200, string $accessToken = null): JsonResponse
    {
        $accessToken  = $accessToken  ?? JWTAuth::fromUser($user);
        // Refresh token has a longer TTL, configured via JWT_REFRESH_TTL in .env
        $refreshToken = JWTAuth::customClaims(['type' => 'refresh'])
                                ->fromUser($user);

        return $this->buildTokenResponse($user, $accessToken, $status, $refreshToken);
    }

    private function buildTokenResponse(User $user, string $accessToken, int $status, string $refreshToken = null): JsonResponse
    {
        $response = response()->json([
            'access_token' => $accessToken,
            'token_type'   => 'Bearer',
            'expires_in'   => config('jwt.ttl') * 60, // seconds
            'user'         => $this->formatUser($user),
        ], $status);

        if ($refreshToken) {
            // httpOnly + SameSite=Strict prevents CSRF and XSS
            $cookie = cookie(
                'refresh_token',
                $refreshToken,
                config('jwt.refresh_ttl'), // minutes
                '/',
                null,
                true,  // secure (HTTPS only in production)
                true,  // httpOnly
                false,
                'Strict'
            );
            $response->withCookie($cookie);
        }

        return $response;
    }

    private function formatUser(User $user): array
    {
        return [
            '_id'                  => (string) $user->_id,
            'name'                 => $user->name,
            'email'                => $user->email,
            'role'                 => $user->role,
            'theme_preference'     => $user->theme_preference ?? 'system',
            'profile'              => $user->profile ?? [],
            'onboarding_completed' => $user->onboarding_completed ?? false,
            'last_login'           => $user->last_login,
            'created_at'           => $user->created_at,
        ];
    }
}
