<?php

namespace App\Policies;

use App\Models\Resource;
use App\Models\User;

class ResourcePolicy
{
    public function view(User $user): bool
    {
        return $user->hasPermissionTo('resource.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('resource.create');
    }

    public function update(User $user, Resource $resource): bool
    {
        return $user->hasPermissionTo('resource.edit');
    }

    public function delete(User $user, Resource $resource): bool
    {
        return $user->hasPermissionTo('resource.delete');
    }
}
