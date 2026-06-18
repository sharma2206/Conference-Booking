<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Booking $booking,
        private readonly string $reminderType
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $label = $this->reminderType === '1_day' ? 'tomorrow' : 'in 1 hour';

        return (new MailMessage)
            ->subject("Reminder: Meeting {$label} - {$this->booking->booking_number}")
            ->greeting("Hello {$notifiable->name},")
            ->line("This is a reminder that you have a meeting scheduled {$label}.")
            ->line("**Booking:** {$this->booking->title}")
            ->line("**Hall:** {$this->booking->hall->name}")
            ->line("**Date:** {$this->booking->booking_date->format('D, d M Y')}")
            ->line("**Time:** {$this->booking->start_time} - {$this->booking->end_time}")
            ->line("**Participants:** {$this->booking->participant_count}")
            ->action('View Booking', url("/bookings/{$this->booking->id}"))
            ->line('Please ensure all preparations are in place.');
    }

    public function toDatabase(object $notifiable): array
    {
        $label = $this->reminderType === '1_day' ? 'tomorrow' : 'in 1 hour';

        return [
            'type' => 'booking_reminder',
            'title' => 'Meeting Reminder',
            'message' => "Reminder: '{$this->booking->title}' is scheduled {$label}.",
            'booking_id' => $this->booking->id,
            'booking_number' => $this->booking->booking_number,
            'reminder_type' => $this->reminderType,
        ];
    }
}
