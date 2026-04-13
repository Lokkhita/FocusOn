<?php
// ════════════════════════════════════════════════
// User Model
// ════════════════════════════════════════════════
namespace App\Models;

use Jenssegers\Mongodb\Eloquent\Model;
use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Model implements AuthenticatableContract, JWTSubject
{
    use Authenticatable;

    protected $connection = 'mongodb';
    protected $collection = 'users';

    protected $fillable = [
        'name', 'email', 'password', 'role',
        'theme_preference', 'profile', 'onboarding_completed',
        'email_verified_at', 'last_login', 'avatar',
    ];

    protected $hidden = ['password'];

    protected $casts = [
        'onboarding_completed' => 'boolean',
        'email_verified_at'    => 'datetime',
        'last_login'           => 'datetime',
        'profile'              => 'array',
    ];

    // JWT Interface methods
    public function getJWTIdentifier(): mixed   { return $this->getKey(); }
    public function getJWTCustomClaims(): array { return []; }

    // Relationships
    public function goals()        { return $this->hasMany(Goal::class,         'user_id'); }
    public function sessions()     { return $this->hasMany(MentorSession::class, 'user_id'); }
    public function progressLogs() { return $this->hasMany(ProgressLog::class,   'user_id'); }
}
