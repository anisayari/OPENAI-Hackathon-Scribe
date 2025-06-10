// Test script for the analyze-script API endpoint
const testScript = `
# L'histoire de SpaceX : De l'impossible au possible

## Introduction (Hook - 15 secondes)
Imaginez qu'on vous dise que dans 20 ans, des fusées privées enverraient des astronautes dans l'espace et reviendraient se poser toutes seules sur Terre. Vous auriez ri, n'est-ce pas ? Pourtant, c'est exactement ce qu'a réalisé SpaceX.

## Acte 1 : Les débuts difficiles
En 2002, Elon Musk crée SpaceX avec une vision folle : réduire le coût de l'accès à l'espace et coloniser Mars. Les trois premiers lancements de leur fusée Falcon 1 sont des échecs cuisants. L'entreprise est au bord de la faillite.

## Acte 2 : La percée
En 2008, le quatrième lancement est un succès. SpaceX devient la première entreprise privée à mettre un satellite en orbite. Mais le vrai tournant arrive avec le développement des fusées réutilisables.

## Acte 3 : La révolution
Aujourd'hui, SpaceX domine le marché des lancements spatiaux. Les fusées Falcon 9 atterrissent comme dans les films de science-fiction. La société a envoyé des astronautes vers l'ISS et prépare activement la colonisation de Mars avec Starship.

## Conclusion
L'histoire de SpaceX nous enseigne qu'avec de la persévérance et une vision audacieuse, même l'impossible peut devenir réalité.
`;

async function testAnalyzeScript() {
  try {
    const response = await fetch('http://localhost:3000/api/ai/analyze-script', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script: testScript,
        context: "Script pour une vidéo YouTube sur l'histoire de SpaceX",
        duration: 180 // 3 minutes
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Analysis Result:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Run the test
testAnalyzeScript();