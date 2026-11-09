<?php
declare(strict_types=1);

namespace BlogNexaAI\Modules\ContentStrategy;

use BlogNexaAI\Modules\AbstractModule;

if (!defined('ABSPATH')) {
    exit;
}

final class Module extends AbstractModule
{
    public function getId(): string
    {
        return 'content-strategy';
    }

    public function getName(): string
    {
        return __('Content Strategy', 'blognexa-ai');
    }
}

