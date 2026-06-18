<?php

namespace App\Policies;

use App\Models\Hall;
use App\Models\User;

class HallPolicy
{
    public function view(User $user, Hall $hall): bool
    {
        return $user->hasPermissionTo('hall.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('hall.create');
    }

    public function update(User $user, Hall $hall): bool
    {
        return $user->hasPermissionTo('hall.edit');
    }

    public function delete(User $user, Hall $hall): bool
    {
        return $user->hasPermissionTo('hall.delete');
    }
}
