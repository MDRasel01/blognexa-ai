<?php
declare(strict_types=1);

namespace BlogNexaAI\Modules\Settings;

use BlogNexaAI\Modules\AbstractModule;

if (!defined('ABSPATH')) {
    exit;
}

final class SettingsModule extends AbstractModule
{
    public function getId(): string
    {
        return 'settings';
    }

    public function getName(): string
    {
        return __('Settings', 'blognexa-ai');
    }
}

