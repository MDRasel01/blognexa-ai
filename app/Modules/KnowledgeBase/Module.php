<?php
declare(strict_types=1);

namespace BlogNexaAI\Modules\KnowledgeBase;

use BlogNexaAI\Modules\AbstractModule;

if (!defined('ABSPATH')) {
    exit;
}

final class Module extends AbstractModule
{
    public function getId(): string
    {
        return 'knowledge-base';
    }

    public function getName(): string
    {
        return __('Knowledge Base', 'blognexa-ai');
    }
}

