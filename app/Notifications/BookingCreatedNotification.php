<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingCreatedNotification extends Notification implements ShouldQueue
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
            ->subject("Booking Created: {$this->booking->booking_number}")
            ->greeting("Hello {$notifiable->name},")
            ->line("Your booking has been created and is pending approval.")
            ->line("**Booking:** {$this->booking->title}")
            ->line("**Hall:** {$this->booking->hall->name}")
            ->line("**Date:** {$this->booking->booking_date->format('D, d M Y')}")
            ->line("**Time:** {$this->booking->start_time} - {$this->booking->end_time}")
            ->line("**Booking Number:** {$this->booking->booking_number}")
            ->action('View Booking', url("/bookings/{$this->booking->id}"))
            ->line('Thank you for using the Conference Hall Booking System.');
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'booking_created',
            'title' => 'Booking Created',
            'message' => "Your booking '{$this->booking->title}' has been created.",
            'booking_id' => $this->booking->id,
            'booking_number' => $this->booking->booking_number,
        ];
    }
}
