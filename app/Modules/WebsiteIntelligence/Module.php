<?php
declare(strict_types=1);

namespace BlogNexaAI\Modules\WebsiteIntelligence;

use BlogNexaAI\Modules\AbstractModule;

if (!defined('ABSPATH')) {
    exit;
}

final class Module extends AbstractModule
{
    public function getId(): string
    {
        return 'website-intelligence';
    }

    public function getName(): string
    {
        return __('Website Intelligence', 'blognexa-ai');
    }
}

