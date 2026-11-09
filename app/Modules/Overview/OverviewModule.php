<?php
declare(strict_types=1);

namespace BlogNexaAI\Modules\Overview;

use BlogNexaAI\Modules\AbstractModule;

if (!defined('ABSPATH')) {
    exit;
}

final class OverviewModule extends AbstractModule
{
    public function getId(): string
    {
        return 'overview';
    }

    public function getName(): string
    {
        return __('Overview', 'blognexa-ai');
    }
}

