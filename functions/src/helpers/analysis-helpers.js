// functions/src/helpers/analysis-helpers.js - Helper functions (from your existing code)

// Helper function to generate smart analysis from Vision data
function generateSmartAnalysis(visionData) {
  const tags = visionData.tags || [];
  const objects = visionData.objects || [];
  const colors = visionData.colors || [];
  
  // Smart category detection
  let category = 'Other';
  let styleCategory = 'casual';
  let season = 'all-season';
  let occasion = 'casual';
  
  // Determine category from tags and objects
  if (tags.some(tag => ['shirt', 'blouse', 'top', 'tshirt', 't-shirt'].includes(tag)) ||
      objects.some(obj => ['shirt', 'blouse', 'top'].includes(obj.name))) {
    category = 'Tops';
  } else if (tags.some(tag => ['pants', 'jeans', 'trousers', 'shorts'].includes(tag))) {
    category = 'Bottoms';
  } else if (tags.some(tag => ['dress', 'gown', 'one-piece garment', 'day dress'].includes(tag))) {
    category = 'Dresses';
  } else if (tags.some(tag => ['jacket', 'coat', 'blazer', 'cardigan'].includes(tag))) {
    category = 'Outerwear';
  } else if (tags.some(tag => ['shoe', 'sneaker', 'boot', 'sandal'].includes(tag))) {
    category = 'Footwear';
  }
  
  // Determine style from tags
  if (tags.some(tag => ['formal', 'business', 'professional', 'suit'].includes(tag))) {
    styleCategory = 'formal';
    occasion = 'work';
  } else if (tags.some(tag => ['sport', 'athletic', 'gym', 'workout'].includes(tag))) {
    styleCategory = 'athletic';
    occasion = 'exercise';
  } else if (tags.some(tag => ['elegant', 'evening', 'party'].includes(tag))) {
    styleCategory = 'elegant';
    occasion = 'evening';
  }
  
  // Determine season from colors and tags
  if (colors.length > 0) {
    const dominantColor = colors[0].hex;
    if (['#000000', '#2F2F2F', '#8B4513'].some(dark => dominantColor.startsWith(dark.slice(0, 3)))) {
      season = 'fall';
    } else if (['#FFFFFF', '#F0F0F0', '#87CEEB'].some(light => dominantColor.startsWith(light.slice(0, 3)))) {
      season = 'summer';
    }
  }
  
  // Generate item name
  const colorName = getColorName(colors[0]?.hex || '#000000');
  const itemType = category === 'Tops' ? 'Shirt' : 
                  category === 'Bottoms' ? 'Pants' : 
                  category === 'Dresses' ? 'Dress' :
                  category === 'Outerwear' ? 'Jacket' : 'Item';
  
  const itemName = `${colorName} ${itemType}`;
  
  return {
    itemName: itemName,
    category: category,
    styleCategory: styleCategory,
    color: colorName,
    pattern: detectPattern(tags),
    season: season,
    occasion: occasion,
    material: detectMaterial(tags),
    detailedDescription: `A ${styleCategory} ${colorName.toLowerCase()} ${itemType.toLowerCase()} perfect for ${occasion} occasions.`,
    confidence: visionData.confidence || 0.8
  };
}

// Helper function to detect material from tags
function detectMaterial(tags) {
  if (tags.some(tag => ['cotton', 'cotton fabric'].includes(tag))) return 'cotton';
  if (tags.some(tag => ['denim', 'jeans'].includes(tag))) return 'denim';
  if (tags.some(tag => ['silk', 'satin'].includes(tag))) return 'silk';
  if (tags.some(tag => ['wool', 'woolen'].includes(tag))) return 'wool';
  if (tags.some(tag => ['leather'].includes(tag))) return 'leather';
  return 'unknown';
}

// Helper function to detect pattern from tags
function detectPattern(tags) {
  if (tags.some(tag => ['striped', 'stripe', 'stripes'].includes(tag))) return 'striped';
  if (tags.some(tag => ['plaid', 'checkered', 'checked'].includes(tag))) return 'plaid';
  if (tags.some(tag => ['floral', 'flower', 'flowers'].includes(tag))) return 'floral';
  if (tags.some(tag => ['polka dot', 'dotted', 'spots'].includes(tag))) return 'polka dot';
  return 'solid';
}

// Helper function to get color name from hex
function getColorName(hex) {
  const colorMap = {
    '#FF0000': 'Red', '#00FF00': 'Green', '#0000FF': 'Blue',
    '#FFFF00': 'Yellow', '#FF00FF': 'Magenta', '#00FFFF': 'Cyan',
    '#000000': 'Black', '#FFFFFF': 'White', '#808080': 'Gray',
    '#FFA500': 'Orange', '#800080': 'Purple', '#FFC0CB': 'Pink',
    '#A52A2A': 'Brown', '#4169E1': 'Blue', '#228B22': 'Green'
  };
  
  // Find closest color
  let closestColor = 'Unknown';
  let minDistance = Infinity;
  
  for (const [colorHex, colorName] of Object.entries(colorMap)) {
    const distance = colorDistance(hex, colorHex);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = colorName;
    }
  }
  
  return closestColor;
}

// Helper function to calculate color distance
function colorDistance(hex1, hex2) {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  
  return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));
}

module.exports = {
  generateSmartAnalysis,
  detectMaterial,
  detectPattern,
  getColorName,
  colorDistance
};