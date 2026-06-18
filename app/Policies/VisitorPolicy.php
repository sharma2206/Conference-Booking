<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Visitor;

class VisitorPolicy
{
    public function view(User $user, Visitor $visitor): bool
    {
        return $user->hasPermissionTo('visitor.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('visitor.create');
    }

    public function update(User $user, Visitor $visitor): bool
    {
        return $user->hasPermissionTo('visitor.edit');
    }

    public function delete(User $user, Visitor $visitor): bool
    {
        return $user->hasPermissionTo('visitor.delete');
    }

    public function checkIn(User $user, Visitor $visitor): bool
    {
        return $user->hasPermissionTo('visitor.check_in');
    }

    public function checkOut(User $user, Visitor $visitor): bool
    {
        return $user->hasPermissionTo('visitor.check_out');
    }

    public function approve(User $user, Visitor $visitor): bool
    {
        return $user->hasPermissionTo('visitor.approve');
    }
}
