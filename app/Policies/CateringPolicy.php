<?php

namespace App\Policies;

use App\Models\CateringMenu;
use App\Models\User;

class CateringPolicy
{
    public function view(User $user): bool
    {
        return $user->hasPermissionTo('catering.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('catering.create');
    }

    public function update(User $user, CateringMenu $menu): bool
    {
        return $user->hasPermissionTo('catering.edit');
    }

    public function delete(User $user, CateringMenu $menu): bool
    {
        return $user->hasPermissionTo('catering.delete');
    }
}
