<?php
declare(strict_types=1);

namespace BlogNexaAI\Modules\Analytics;

use BlogNexaAI\Modules\AbstractModule;

if (!defined('ABSPATH')) {
    exit;
}

final class Module extends AbstractModule
{
    public function getId(): string
    {
        return 'analytics';
    }

    public function getName(): string
    {
        return __('Performance Analytics', 'blognexa-ai');
    }
}

