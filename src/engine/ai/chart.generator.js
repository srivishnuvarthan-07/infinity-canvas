import { createRectangle, createText, createLine, createImage } from '../schema';

const COLORS = [
    '#4F46E5', // Indigo
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F43F5E', // Rose
    '#84CC16', // Lime
];

function generateIdBase() {
    return Math.random().toString(36).substring(2, 9);
}

export function generateChartShapes(intent) {
    const chart = intent.chart;
    if (!chart || !chart.data || chart.data.length === 0) return [];

    const shapes = [];
    const titleId = `title-${generateIdBase()}`;
    
    if (chart.chartType === 'pie') {
        return generatePieChartImage(chart);
    }

    const titleShape = createText(titleId, 0, -250, chart.title || 'Chart', 36);
    titleShape.font.weight = 'bold';
    shapes.push(titleShape);

    generateBarChart(chart.data, shapes);

    const wid = `group-${generateIdBase()}`;
    return [{
        id: wid,
        type: 'group',
        zIndex: 0,
        position: { x: 0, y: 0 },
        rotation: 0,
        scale: { x: 1, y: 1 },
        locked: false,
        visible: true,
        size: { width: 800, height: 600 },
        style: { stroke: 'transparent', strokeWidth: 0, fill: 'transparent', opacity: 1, renderMode: 'vector', roughness: 0, seed: 12345, fillStyle: 'solid' },
        children: shapes,
        revision: { number: 1, timestamp: Date.now() }
    }];
}

function generateBarChart(data, shapes) {
    const chartWidth = 600;
    const chartHeight = 300;
    const originX = -chartWidth / 2;
    const originY = chartHeight / 2;
    
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    const yAxis = createLine(`yaxis-${generateIdBase()}`, { x: originX, y: originY - chartHeight - 20 }, { x: originX, y: originY });
    yAxis.style.strokeWidth = 3;
    shapes.push(yAxis);
    
    const xAxis = createLine(`xaxis-${generateIdBase()}`, { x: originX, y: originY }, { x: originX + chartWidth + 20, y: originY });
    xAxis.style.strokeWidth = 3;
    shapes.push(xAxis);

    const numBars = data.length;
    const barSpacing = chartWidth / numBars;
    const barWidth = barSpacing * 0.6;
    
    data.forEach((item, index) => {
        const barHeight = (item.value / maxValue) * chartHeight;
        const cx = originX + (index * barSpacing) + (barSpacing / 2);
        const cy = originY - barHeight / 2;
        
        const rect = createRectangle(`bar-${generateIdBase()}`, cx, cy, barWidth, barHeight);
        rect.style.fill = COLORS[index % COLORS.length];
        rect.style.fillStyle = 'solid';
        rect.style.stroke = COLORS[index % COLORS.length];
        shapes.push(rect);
        
        const label = createText(`label-${generateIdBase()}`, cx, originY + 20, item.label || '', 16);
        shapes.push(label);
        
        const valText = createText(`val-${generateIdBase()}`, cx, originY - barHeight - 15, String(item.value), 16);
        shapes.push(valText);
    });
}

function generatePieChartImage(chart) {
    const labels = chart.data.map(d => d.label);
    const values = chart.data.map(d => d.value);
    
    const chartConfig = {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: COLORS.slice(0, values.length)
            }]
        },
        options: {
            plugins: {
                title: {
                    display: !!chart.title,
                    text: chart.title || ''
                },
                rough: {
                    roughness: 2,
                    bowing: 1,
                    fillStyle: 'hachure'
                }
            }
        }
    };

    const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
    const imageUrl = `https://quickchart.io/chart?c=${encodedConfig}&w=500&h=500`;

    const imgShape = createImage(`pie-img-${generateIdBase()}`, 0, 0, imageUrl, 500, 500);
    return [imgShape];
}
