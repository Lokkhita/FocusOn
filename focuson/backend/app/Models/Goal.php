<?php
namespace App\Models;
use Jenssegers\Mongodb\Eloquent\Model;

class Goal extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'goals';

    protected $fillable = [
        'user_id', 'title', 'description', 'category', 'status',
        'timeframe', 'clarity_score', 'ai_clarifications',
        'situation_analysis', 'target_date', 'onboarding_completed',
    ];

    protected $casts = [
        'ai_clarifications'  => 'array',
        'situation_analysis' => 'array',
        'clarity_score'      => 'integer',
        'target_date'        => 'datetime',
    ];

    public function user()          { return $this->belongsTo(User::class,         'user_id'); }
    public function roadmap()       { return $this->hasOne(Roadmap::class,          'goal_id'); }
    public function strategicPaths(){ return $this->hasOne(StrategicPath::class,   'goal_id'); }
    public function progressLogs()  { return $this->hasMany(ProgressLog::class,    'goal_id'); }
}
