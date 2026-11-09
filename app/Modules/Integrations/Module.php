<?php
declare(strict_types=1);

namespace BlogNexaAI\Modules\Integrations;

use BlogNexaAI\Modules\AbstractModule;

if (!defined('ABSPATH')) {
    exit;
}

final class Module extends AbstractModule
{
    public function getId(): string
    {
        return 'integrations';
    }

    public function getName(): string
    {
        return __('Integrations', 'blognexa-ai');
    }
}

