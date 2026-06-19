<?php

namespace Database\Seeders;

use App\Models\BrandingSetting;
use Illuminate\Database\Seeder;

class BrandingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // ── General ───────────────────────────────────────────────
            [
                'key'         => 'company_name',
                'value'       => 'Conference Booking',
                'type'        => 'text',
                'group'       => 'general',
                'label'       => 'Company Name',
                'description' => 'The full company or organisation name.',
            ],
            [
                'key'         => 'short_name',
                'value'       => 'CB',
                'type'        => 'text',
                'group'       => 'general',
                'label'       => 'Short Name / Abbreviation',
                'description' => 'Used in compact UI areas such as avatar initials.',
            ],
            [
                'key'         => 'tagline',
                'value'       => 'Book your space, inspire your team',
                'type'        => 'text',
                'group'       => 'general',
                'label'       => 'Tagline',
                'description' => 'Short tagline shown on the login page and marketing areas.',
            ],

            // ── Colors ────────────────────────────────────────────────
            [
                'key'         => 'primary_color',
                'value'       => '#3b82f6',
                'type'        => 'color',
                'group'       => 'colors',
                'label'       => 'Primary Color',
                'description' => 'Main brand color used for buttons, links, and accents.',
            ],
            [
                'key'         => 'secondary_color',
                'value'       => '#1e293b',
                'type'        => 'color',
                'group'       => 'colors',
                'label'       => 'Secondary Color',
                'description' => 'Used for sidebar backgrounds and secondary elements.',
            ],
            [
                'key'         => 'accent_color',
                'value'       => '#8b5cf6',
                'type'        => 'color',
                'group'       => 'colors',
                'label'       => 'Accent Color',
                'description' => 'Highlight color for badges, tags, and special elements.',
            ],
            [
                'key'         => 'success_color',
                'value'       => '#10b981',
                'type'        => 'color',
                'group'       => 'colors',
                'label'       => 'Success Color',
                'description' => 'Color for success states, confirmations, and approved statuses.',
            ],
            [
                'key'         => 'danger_color',
                'value'       => '#ef4444',
                'type'        => 'color',
                'group'       => 'colors',
                'label'       => 'Danger / Error Color',
                'description' => 'Color for error states, rejections, and destructive actions.',
            ],
            [
                'key'         => 'warning_color',
                'value'       => '#f59e0b',
                'type'        => 'color',
                'group'       => 'colors',
                'label'       => 'Warning Color',
                'description' => 'Color for warnings and pending states.',
            ],
            [
                'key'         => 'info_color',
                'value'       => '#06b6d4',
                'type'        => 'color',
                'group'       => 'colors',
                'label'       => 'Info Color',
                'description' => 'Color for informational messages and tooltips.',
            ],

            // ── Typography ────────────────────────────────────────────
            [
                'key'         => 'font_family',
                'value'       => 'Inter',
                'type'        => 'text',
                'group'       => 'typography',
                'label'       => 'Font Family',
                'description' => 'Primary font family. Must be available via Google Fonts or system fonts.',
            ],
            [
                'key'         => 'font_size',
                'value'       => '14',
                'type'        => 'number',
                'group'       => 'typography',
                'label'       => 'Base Font Size (px)',
                'description' => 'Base font size in pixels for body text.',
            ],
            [
                'key'         => 'heading_style',
                'value'       => 'bold',
                'type'        => 'text',
                'group'       => 'typography',
                'label'       => 'Heading Style',
                'description' => 'Heading font weight: bold, semibold, or normal.',
            ],

            // ── Buttons ───────────────────────────────────────────────
            [
                'key'         => 'button_radius',
                'value'       => '8',
                'type'        => 'number',
                'group'       => 'buttons',
                'label'       => 'Button Border Radius (px)',
                'description' => 'Corner rounding for buttons in pixels.',
            ],
            [
                'key'         => 'button_style',
                'value'       => 'filled',
                'type'        => 'text',
                'group'       => 'buttons',
                'label'       => 'Button Style',
                'description' => 'Primary button style: filled, outlined, or ghost.',
            ],
            [
                'key'         => 'button_shadow',
                'value'       => 'sm',
                'type'        => 'text',
                'group'       => 'buttons',
                'label'       => 'Button Shadow',
                'description' => 'Shadow intensity: none, sm, md, or lg.',
            ],

            // ── Tables ────────────────────────────────────────────────
            [
                'key'         => 'table_header_color',
                'value'       => '#f8fafc',
                'type'        => 'color',
                'group'       => 'tables',
                'label'       => 'Table Header Background',
                'description' => 'Background color for table header rows.',
            ],
            [
                'key'         => 'table_border_style',
                'value'       => 'light',
                'type'        => 'text',
                'group'       => 'tables',
                'label'       => 'Table Border Style',
                'description' => 'Border style for data tables: none, light, medium, or heavy.',
            ],

            // ── Cards ─────────────────────────────────────────────────
            [
                'key'         => 'card_border_radius',
                'value'       => '12',
                'type'        => 'number',
                'group'       => 'cards',
                'label'       => 'Card Border Radius (px)',
                'description' => 'Corner rounding for card components in pixels.',
            ],
            [
                'key'         => 'card_background',
                'value'       => '#ffffff',
                'type'        => 'color',
                'group'       => 'cards',
                'label'       => 'Card Background Color',
                'description' => 'Background color for card components.',
            ],

            // ── Images ────────────────────────────────────────────────
            [
                'key'         => 'logo_url',
                'value'       => null,
                'type'        => 'image',
                'group'       => 'images',
                'label'       => 'Logo (Light)',
                'description' => 'Primary logo used on light backgrounds. Recommended: SVG or PNG.',
            ],
            [
                'key'         => 'logo_dark_url',
                'value'       => null,
                'type'        => 'image',
                'group'       => 'images',
                'label'       => 'Logo (Dark)',
                'description' => 'Logo variant for dark backgrounds.',
            ],
            [
                'key'         => 'favicon_url',
                'value'       => null,
                'type'        => 'image',
                'group'       => 'images',
                'label'       => 'Favicon',
                'description' => 'Browser tab icon. Recommended: 32×32 PNG or ICO.',
            ],
            [
                'key'         => 'login_bg_url',
                'value'       => null,
                'type'        => 'image',
                'group'       => 'images',
                'label'       => 'Login Background Image',
                'description' => 'Full-page background image for the login page.',
            ],

            // ── Login ─────────────────────────────────────────────────
            [
                'key'         => 'login_title',
                'value'       => 'Welcome Back',
                'type'        => 'text',
                'group'       => 'login',
                'label'       => 'Login Page Title',
                'description' => 'Heading shown on the login page.',
            ],
            [
                'key'         => 'login_welcome',
                'value'       => 'Sign in to manage your conference halls',
                'type'        => 'text',
                'group'       => 'login',
                'label'       => 'Login Welcome Message',
                'description' => 'Subtitle or welcome message shown below the login heading.',
            ],
            [
                'key'         => 'login_footer',
                'value'       => '© 2025 Conference Booking. All rights reserved.',
                'type'        => 'text',
                'group'       => 'login',
                'label'       => 'Login Footer Text',
                'description' => 'Footer text displayed at the bottom of the login page.',
            ],
        ];

        foreach ($settings as $setting) {
            BrandingSetting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
