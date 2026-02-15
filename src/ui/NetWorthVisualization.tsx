import { makeNetWorthData } from '../balance-utils';
import { Interval, makeBucketNames } from '../date-utils';
import { ISettings } from '../settings';
import { ILineChartOptions } from 'chartist';
import { Moment } from 'moment';
import React from 'react';
import ReactDOM from 'react-dom';
import ChartistGraph from 'react-chartist';
import styled from 'styled-components';

const Chart = styled.div`
  .ct-label {
    color: var(--text-muted);
  }
  .ct-point {
    stroke-width: 10px;
    cursor: pointer;
  }
`;

const Tooltip = styled.div`
  position: fixed;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 9999;
  white-space: pre-line;
  transform: translate(-50%, -100%);
`;

export const NetWorthVisualization: React.FC<{
  dailyAccountBalanceMap: Map<string, Map<string, number>>;
  startDate: Moment;
  endDate: Moment;
  interval: Interval;
  settings: ISettings;
}> = (props): JSX.Element => {
  const [tooltip, setTooltip] = React.useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  } | null>(null);
  const chartRef = React.useRef<HTMLDivElement>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const container = chartRef.current;
    if (!container) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('ct-point')) {
        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
          const metaStr = target.getAttribute('ct:meta');
          if (metaStr) {
            const rect = target.getBoundingClientRect();
            setTooltip({
              visible: true,
              x: rect.left + rect.width / 2,
              y: rect.top - 10,
              content: metaStr,
            });
          }
        }, 200); // Reduced delay for better responsiveness
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('ct-point')) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setTooltip(null);
      }
    };

    container.addEventListener('mouseover', handleMouseOver);
    container.addEventListener('mouseout', handleMouseOut);

    return () => {
      container.removeEventListener('mouseover', handleMouseOver);
      container.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  const dateBuckets = makeBucketNames(
    props.interval,
    props.startDate,
    props.endDate,
  );
  const data = {
    labels: dateBuckets,
    series: [
      makeNetWorthData(
        props.dailyAccountBalanceMap,
        dateBuckets,
        props.settings,
      ),
    ],
  };

  const hasNonZeroData = data.series[0].some((d) => d.y !== 0);

  const options: ILineChartOptions = {
    height: '300px',
    width: '100%',
    showArea: false,
    showPoint: true,
  };

  const type = 'Line';
  return (
    <>
      <h2>Net Worth</h2>
      <i>Assets minus liabilities</i>

      {!hasNonZeroData && (
        <div
          style={{
            padding: '10px',
            background: 'var(--background-modifier-error)',
            color: 'var(--text-on-accent)',
            marginTop: '10px',
            borderRadius: '4px',
          }}
        >
          {/* {t('net-worth-zero-warning')} */}
        </div>
      )}

      <Chart ref={chartRef}>
        <ChartistGraph data={data} options={options} type={type} />
        {tooltip &&
          tooltip.visible &&
          ReactDOM.createPortal(
            <Tooltip style={{ left: tooltip.x, top: tooltip.y }}>
              {tooltip.content}
            </Tooltip>,
            document.body,
          )}
      </Chart>
    </>
  );
};