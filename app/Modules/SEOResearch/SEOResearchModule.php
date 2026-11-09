<?php
declare(strict_types=1);

namespace BlogNexaAI\Modules\SEOResearch;

use BlogNexaAI\Modules\AbstractModule;

if (!defined('ABSPATH')) {
    exit;
}

final class SEOResearchModule extends AbstractModule
{
    public function getId(): string
    {
        return 'seo-research';
    }

    public function getName(): string
    {
        return __('SEO Research', 'blognexa-ai');
    }
}

