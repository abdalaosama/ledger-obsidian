import type { SankeyData } from '../DashboardDataService';
import React from 'react';
import ReactECharts from 'echarts-for-react';
import styled from 'styled-components';
import { getChartColors, observeThemeChange } from '../theme-utils';

const ChartContainer = styled.div`
  width: 100%;
  background: var(--background-secondary);
  border: 1px solid var(--background-modifier-border);
  border-radius: 8px;
  padding: 16px;
`;

const ChartTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--text-normal);
`;

interface SankeyChartProps {
    data: SankeyData;
    currencySymbol: string;
}

export const SankeyChart: React.FC<SankeyChartProps> = ({ data, currencySymbol }) => {
    const [refreshKey, setRefreshKey] = React.useState(0);

    // Listen for theme changes
    React.useEffect(() => {
        const cleanup = observeThemeChange(() => {
            setRefreshKey(prev => prev + 1); // Force re-render
        });
        return cleanup;
    }, []);

    const formatCurrency = (amount: number): string => {
        return `${currencySymbol}${Math.abs(amount).toLocaleString('zh-CN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })}`;
    };

    const sankeyOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
                if (params.dataType === 'edge') {
                    return `${params.data.source} → ${params.data.target}<br/>${formatCurrency(params.data.value)}`;
                }
                // Show node name with tooltip for nodes
                return `${params.name}`;
            },
        },
        series: [
            {
                type: 'sankey',
                layout: 'none',
                nodeAlign: 'justify',
                layoutIterations: 64,
                emphasis: {
                    focus: 'adjacency',
                },
                // ✅ Symmetric layout: left and right are nearly symmetric, right side is slightly wider to accommodate labels
                left: '4%',
                top: '5%',
                right: '8%',     // Right 8%, nearly symmetric to left 4%
                bottom: '5%',
                nodeWidth: 20,
                nodeGap: 10,
                lineStyle: {
                    color: 'gradient',  // Gradient connecting lines
                    curveness: 0.5,
                    opacity: 0.4,
                },
                itemStyle: {
                    borderWidth: 0,
                },
                label: {
                    show: true,
                    position: 'right',
                    distance: 5,      // ✅ Compact label spacing
                    color: getChartColors().text,
                    fontSize: 12,
                },
                data: data.nodes.map((node) => {
                    // ✅ Color logic: use includes for loose matching
                    let color = '#9CA3AF';  // Default gray

                    const name = node.name || '';

                    // Left side logic
                    if (name.includes('Income') || name.includes('Income')) {
                        color = '#10B981';  // Emerald green
                    } else if (name.includes('Debt') || name.includes('Reserve Depletion')) {
                        color = '#F43F5E';  // Red
                    } else if (name.includes('Balance Consumption')) {
                        color = '#3B82F6';  // Blue
                    }
                    // Right side logic - Debt Repayment
                    else if (name.includes('Debt Repayment') || name.includes('Repayment')) {
                        color = '#F97316';  // Orange (Debt Repayment)
                    }
                    // Right side logic - All expense categories turn green
                    else if (name.includes('Expense') || name.includes('Expense') ||
                        name.includes('Insurance') || name.includes('Dining') ||
                        name.includes('Shopping') || name.includes('Communication') ||
                        name.includes('Transportation') || name.includes('Entertainment') ||
                        name.includes('Education') || name.includes('Medical') ||
                        name.includes('Housing') || name.includes('Other')) {
                        color = '#34D399';  // Light green (Expense)
                    } else if (name.includes('Balance') || name.includes('Savings') || name.includes('Savings')) {
                        color = '#059669';  // Dark green (Balance)
                    }

                    return {
                        name: node.name,
                        itemStyle: { color },
                    };
                }),
                links: data.links.map((link) => ({
                    source: link.source,
                    target: link.target,
                    value: link.value,
                })),
            },
        ],
    };

    return (
        <div>
            <ChartTitle>Financial Flow</ChartTitle>
            <ChartContainer>
                <ReactECharts
                    option={sankeyOption}
                    style={{ height: '350px' }}
                    opts={{ renderer: 'svg' }}
                />
            </ChartContainer>
        </div>
    );
};
