import React from 'react';
import ReactECharts from 'echarts-for-react';
import styled from 'styled-components';
import { TreemapNode } from '../financial-report-utils';
import { getChartColors, observeThemeChange } from '../theme-utils';

const Container = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChartSection = styled.div`
  width: 100%;
`;

const ChartContainer = styled.div`
  width: 100%;
  background: var(--background-secondary);
  border: 1px solid var(--background-modifier-border);
  border-radius: 8px;
  padding: 8px;
`;

const ChartTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 16px;
  color: var(--text-normal);
`;

const TotalText = styled.div`
  padding: 12px 8px 8px 5%;
  font-size: 14px;
  color: var(--text-normal);
  text-align: left;
`;

interface DualTreemapProps {
    assetsData: TreemapNode[];
    liabilitiesData: TreemapNode[];
    currencySymbol: string;
}

export const DualTreemap: React.FC<DualTreemapProps> = ({
    assetsData,
    liabilitiesData,
    currencySymbol,
}) => {
    const formatCurrency = (value: number) => {
        return `${currencySymbol}${value.toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    // Calculate total assets and liabilities
    const calculateTotal = (data: TreemapNode[]): number => {
        return data.reduce((sum, node) => sum + (node.value || 0), 0);
    };

    const totalAssets = calculateTotal(assetsData);
    const totalLiabilities = calculateTotal(liabilitiesData);

    const getOption = (
        data: TreemapNode[],
        title: string,
        colors: string[]
    ) => ({
        backgroundColor: 'transparent',
        tooltip: {
            formatter: (info: any) => {
                const value = info.value;
                const treePathInfo = info.treePathInfo;
                const treePath = [];

                for (let i = 1; i < treePathInfo.length; i++) {
                    treePath.push(treePathInfo[i].name);
                }

                return [
                    `<div class="tooltip-title">${treePath.join(' > ')}</div>`,
                    `Amount: ${formatCurrency(value)}`,
                ].join('');
            },
        },
        series: [
            {
                name: title,
                type: 'treemap',
                visibleMin: 300,
                top: '5%',
                bottom: '8%',
                left: '5%',
                right: '5%',
                label: {
                    show: true,
                    formatter: '{b}',
                    fontSize: 12,
                    color: getChartColors().text,
                },
                itemStyle: {
                    borderWidth: 0,
                },
                breadcrumb: {
                    show: false,
                },
                data: data,
                levels: [
                    {
                        itemStyle: {
                            borderWidth: 0,
                        },
                    },
                    {
                        color: colors,
                        colorMappingBy: 'index',
                        itemStyle: {
                            borderWidth: 0,
                        },
                    },
                ],
                roam: false,
                nodeClick: false,
            },
        ],
    });

    const assetColors = [
        '#10B981',
        '#059669',
        '#34D399',
        '#14B8A6',
        '#0D9488',
        '#2DD4BF',
        '#047857',
        '#6EE7B7',
    ];

    const liabilityColors = [
        '#EF4444',
        '#DC2626',
        '#F87171',
        '#FB7185',
        '#E11D48',
        '#FDA4AF',
        '#BE123C',
        '#FCA5A5',
    ];

    return (
        <Container>
            <ChartSection>
                <ChartTitle>Asset Composition</ChartTitle>
                <ChartContainer>
                    <TotalText>Total Assets: {formatCurrency(totalAssets)}</TotalText>
                    <ReactECharts
                        option={getOption(assetsData, 'Assets', assetColors)}
                        style={{ height: '350px' }}
                        opts={{ renderer: 'svg' }}
                    />
                </ChartContainer>
            </ChartSection>
            <ChartSection>
                <ChartTitle>Liability Distribution</ChartTitle>
                <ChartContainer>
                    <TotalText>Total Liabilities: {formatCurrency(totalLiabilities)}</TotalText>
                    <ReactECharts
                        option={getOption(liabilitiesData, 'Liabilities', liabilityColors)}
                        style={{ height: '350px' }}
                        opts={{ renderer: 'svg' }}
                    />
                </ChartContainer>
            </ChartSection>
        </Container>
    );
};
