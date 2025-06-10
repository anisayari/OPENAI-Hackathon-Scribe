export function getMockYouTubeResults(topic: string) {
  const cleanTopic = topic.replace(/je veux faire une vidéo sur les?/i, '').trim();
  
  return {
    searchResults: [
      {
        id: 'mock_video_1',
        title: `Les robots humanoïdes : révolution technologique ou menace économique ?`,
        url: 'https://youtube.com/watch?v=mock_video_1',
        channel: 'Tech & Innovation FR',
        publishedAt: '2024-11-15',
        viewCount: '125,000',
        description: `Analyse approfondie de l'impact des robots humanoïdes sur l'économie mondiale. Cette vidéo explore les avantages et les défis posés par l'automatisation croissante.`
      },
      {
        id: 'mock_video_2', 
        title: `L'économie face aux humanoïdes : 10 métiers qui vont disparaître`,
        url: 'https://youtube.com/watch?v=mock_video_2',
        channel: 'Économie 2.0',
        publishedAt: '2024-12-01',
        viewCount: '89,000',
        description: `Découvrez quels emplois sont menacés par l'arrivée des robots humanoïdes et comment s'adapter à cette transformation économique.`
      },
      {
        id: 'mock_video_3',
        title: `Tesla Optimus et Figure 01 : Les humanoïdes qui transforment l'industrie`,
        url: 'https://youtube.com/watch?v=mock_video_3',
        channel: 'Future Tech Daily',
        publishedAt: '2024-10-20',
        viewCount: '210,000',
        description: `Présentation des derniers robots humanoïdes et leur impact sur les chaînes de production industrielle.`
      },
      {
        id: 'mock_video_4',
        title: `Humanoïdes en 2025 : Opportunités d'investissement et nouveaux marchés`,
        url: 'https://youtube.com/watch?v=mock_video_4',
        channel: 'Investir Malin',
        publishedAt: '2025-01-05',
        viewCount: '45,000',
        description: `Guide complet pour comprendre les opportunités économiques créées par la robotique humanoïde.`
      },
      {
        id: 'mock_video_5',
        title: `Le Japon mise sur les humanoïdes pour pallier le vieillissement`,
        url: 'https://youtube.com/watch?v=mock_video_5',
        channel: 'Asie Tech News',
        publishedAt: '2024-09-10',
        viewCount: '156,000',
        description: `Comment le Japon utilise les robots humanoïdes pour résoudre ses défis démographiques et économiques.`
      }
    ],
    
    videoLandscape: {
      total_results: 1250,
      trending_topics: [
        'Impact sur l\'emploi',
        'Robots Tesla Optimus',
        'Économie de l\'automatisation',
        'Éthique et régulation',
        'Investissement en robotique'
      ],
      content_gaps: [
        'Impact sur les PME',
        'Formation et reconversion',
        'Aspects psychologiques',
        'Comparaisons internationales'
      ],
      successful_formats: [
        'Analyses économiques détaillées',
        'Interviews d\'experts',
        'Démonstrations pratiques',
        'Débats contradictoires'
      ]
    },
    
    seoKeywords: {
      primary_keywords: [
        'robots humanoïdes économie',
        'impact économique robots',
        'automatisation emploi',
        'humanoïdes 2025',
        'révolution robotique'
      ],
      long_tail_keywords: [
        'comment les robots humanoïdes transforment l\'économie',
        'impact des humanoïdes sur le marché du travail',
        'investir dans la robotique humanoïde',
        'robots humanoïdes avantages inconvénients',
        'futur du travail avec les humanoïdes'
      ],
      trending_hashtags: [
        '#RobotsHumanoïdes',
        '#ÉconomieRobotique',
        '#FuturDuTravail',
        '#AutomatisationEmploi',
        '#TechÉconomie'
      ]
    }
  };
}

export function simulateYouTubeToolCalls(topic: string, sessionId?: string) {
  const mockData = getMockYouTubeResults(topic);
  
  // Simulate search_youtube_videos
  const searchEvent = {
    tool: 'search_youtube_videos',
    results: mockData.searchResults,
    timestamp: Date.now()
  };
  
  // Simulate analyze_video_landscape
  const landscapeEvent = {
    tool: 'analyze_video_landscape',
    results: mockData.videoLandscape,
    timestamp: Date.now() + 1000
  };
  
  // Simulate extract_youtube_seo
  const seoEvent = {
    tool: 'extract_youtube_seo',
    results: mockData.seoKeywords,
    timestamp: Date.now() + 2000
  };
  
  return {
    searchEvent,
    landscapeEvent,
    seoEvent,
    allResults: mockData
  };
}