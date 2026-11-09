<?php
declare(strict_types=1);

namespace BlogNexaAI\Modules\Publishing;

use BlogNexaAI\Modules\AbstractModule;

if (!defined('ABSPATH')) {
    exit;
}

final class PublishingModule extends AbstractModule
{
    public function getId(): string
    {
        return 'publishing';
    }

    public function getName(): string
    {
        return __('Publishing & Scheduling', 'blognexa-ai');
    }
}

