<?php
namespace App\Models;
use Jenssegers\Mongodb\Eloquent\Model;

class Roadmap extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'roadmaps';

    protected $fillable = [
        'goal_id', 'user_id', 'path_id', 'phases', 'overall_progress',
    ];

    protected $casts = [
        'phases'           => 'array',
        'overall_progress' => 'float',
    ];

    public function goal() { return $this->belongsTo(Goal::class, 'goal_id'); }

    /**
     * Recalculate overall_progress from milestone statuses.
     * Call after any milestone status update.
     */
    public function recalculateProgress(): void
    {
        $total     = 0;
        $completed = 0;

        foreach ($this->phases ?? [] as $phase) {
            foreach ($phase['milestones'] ?? [] as $milestone) {
                $total++;
                if (($milestone['status'] ?? '') === 'completed') $completed++;
            }
        }

        $progress = $total > 0 ? round(($completed / $total) * 100, 1) : 0;
        $this->update(['overall_progress' => $progress]);
    }
}
