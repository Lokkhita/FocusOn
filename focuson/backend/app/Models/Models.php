<?php
namespace App\Models;
use Jenssegers\Mongodb\Eloquent\Model;

class StrategicPath extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'strategic_paths';
    protected $fillable   = ['goal_id', 'user_id', 'paths', 'chosen_path_id', 'chosen_at'];
    protected $casts      = ['paths' => 'array', 'chosen_at' => 'datetime'];
}

class MentorSession extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'mentor_sessions';
    protected $fillable   = ['user_id', 'goal_id', 'messages', 'session_type', 'total_tokens'];
    protected $casts      = ['messages' => 'array', 'total_tokens' => 'integer'];
}

class ProgressLog extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'progress_logs';
    protected $fillable   = ['user_id', 'goal_id', 'milestone_id', 'action', 'note', 'mood', 'ai_feedback', 'logged_at'];
    protected $casts      = ['logged_at' => 'datetime'];
    public $timestamps    = false;
}
