<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private array $statusMessages = [
        'approved' => ['title' => 'Booking Approved', 'color' => 'green'],
        'rejected' => ['title' => 'Booking Rejected', 'color' => 'red'],
        'cancelled' => ['title' => 'Booking Cancelled', 'color' => 'orange'],
        'completed' => ['title' => 'Booking Completed', 'color' => 'blue'],
    ];

    public function __construct(private readonly Booking $booking, private readonly string $status) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $info = $this->statusMessages[$this->status] ?? ['title' => 'Booking Update', 'color' => 'gray'];

        $mail = (new MailMessage)
            ->subject("{$info['title']}: {$this->booking->booking_number}")
            ->greeting("Hello {$notifiable->name},")
            ->line("Your booking status has been updated to **" . ucfirst($this->status) . "**.")
            ->line("**Booking:** {$this->booking->title}")
            ->line("**Hall:** {$this->booking->hall->name}")
            ->line("**Date:** {$this->booking->booking_date->format('D, d M Y')}")
            ->line("**Time:** {$this->booking->start_time} - {$this->booking->end_time}");

        if ($this->status === 'rejected' && $this->booking->rejection_reason) {
            $mail->line("**Reason:** {$this->booking->rejection_reason}");
        }

        return $mail
            ->action('View Booking', url("/bookings/{$this->booking->id}"))
            ->line('Thank you for using the Conference Hall Booking System.');
    }

    public function toDatabase(object $notifiable): array
    {
        $info = $this->statusMessages[$this->status] ?? ['title' => 'Booking Update'];

        return [
            'type' => "booking_{$this->status}",
            'title' => $info['title'],
            'message' => "Your booking '{$this->booking->title}' has been {$this->status}.",
            'booking_id' => $this->booking->id,
            'booking_number' => $this->booking->booking_number,
            'status' => $this->status,
        ];
    }
}
