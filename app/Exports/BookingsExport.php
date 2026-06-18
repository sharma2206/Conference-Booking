<?php

namespace App\Exports;

use App\Models\Booking;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class BookingsExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    public function __construct(private readonly array $filters = []) {}

    public function query()
    {
        return Booking::with(['hall:id,name', 'user:id,name', 'department:id,name'])
            ->when($this->filters['date_from'] ?? null, fn($q, $v) => $q->where('booking_date', '>=', $v))
            ->when($this->filters['date_to'] ?? null, fn($q, $v) => $q->where('booking_date', '<=', $v))
            ->when($this->filters['status'] ?? null, fn($q, $v) => $q->where('status', $v))
            ->when($this->filters['hall_id'] ?? null, fn($q, $v) => $q->where('hall_id', $v))
            ->orderByDesc('booking_date');
    }

    public function headings(): array
    {
        return [
            'Booking #',
            'Title',
            'Hall',
            'Organizer',
            'Department',
            'Date',
            'Start Time',
            'End Time',
            'Duration (min)',
            'Participants',
            'Status',
            'Purpose',
            'Created At',
        ];
    }

    public function map($booking): array
    {
        return [
            $booking->booking_number,
            $booking->title,
            $booking->hall?->name,
            $booking->user?->name,
            $booking->department?->name,
            $booking->booking_date?->format('Y-m-d'),
            $booking->start_time,
            $booking->end_time,
            $booking->duration_minutes,
            $booking->participant_count,
            ucfirst($booking->status),
            $booking->purpose,
            $booking->created_at?->format('Y-m-d H:i'),
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true], 'fill' => ['fillType' => 'solid', 'startColor' => ['argb' => 'FF3B82F6']]],
        ];
    }
}
