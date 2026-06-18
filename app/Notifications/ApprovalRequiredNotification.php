<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApprovalRequiredNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly Booking $booking) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Approval Required: {$this->booking->booking_number}")
            ->greeting("Hello {$notifiable->name},")
            ->line("A booking requires your approval.")
            ->line("**Booking:** {$this->booking->title}")
            ->line("**Requested by:** {$this->booking->user->name}")
            ->line("**Hall:** {$this->booking->hall->name}")
            ->line("**Date:** {$this->booking->booking_date->format('D, d M Y')}")
            ->line("**Time:** {$this->booking->start_time} - {$this->booking->end_time}")
            ->line("**Participants:** {$this->booking->participant_count}")
            ->action('Review Booking', url("/bookings/{$this->booking->id}/approve"))
            ->line('Please review and take action on this booking request.');
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'approval_required',
            'title' => 'Approval Required',
            'message' => "Booking '{$this->booking->title}' by {$this->booking->user->name} requires your approval.",
            'booking_id' => $this->booking->id,
            'booking_number' => $this->booking->booking_number,
        ];
    }
}
