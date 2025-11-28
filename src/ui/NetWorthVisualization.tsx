import { makeNetWorthData } from '../balance-utils';
import { Interval, makeBucketNames } from '../date-utils';
import { ISettings } from '../settings';
import { ILineChartOptions } from 'chartist';
import { Moment } from 'moment';
import React, { useRef } from 'react';
import ChartistGraph from 'react-chartist';
import styled from 'styled-components';
import { useChartTooltip } from './ChartTooltip';

const Chart = styled.div`
  .ct-label {
    color: var(--text-muted);
  }
`;

export const NetWorthVisualization: React.FC<{
  dailyAccountBalanceMap: Map<string, Map<string, number>>;
  startDate: Moment;
  endDate: Moment;
  interval: Interval;
  settings: ISettings;
}> = (props): JSX.Element => {
  const dateBuckets = makeBucketNames(
    props.interval,
    props.startDate,
    props.endDate,
  );

  const displayLabels = dateBuckets.map((date) => {
    const m = window.moment(date);
    if (props.interval === 'month') {
      return m.format('YYYY-MM');
    } else if (props.interval === 'week') {
      return m.format('YYYY[W]WW');
    } else {
      if (m.month() === 0) {
        return m.format('YYYY-MM-DD');
      }
      return m.format('MM-DD');
    }
  });

  const data = {
    labels: displayLabels,
    series: [
      makeNetWorthData(
        props.dailyAccountBalanceMap,
        dateBuckets,
        props.settings,
      ),
    ],
  };

  const options: ILineChartOptions = {
    height: '300px',
    width: '100%',
    showArea: false,
    showPoint: true,
    axisY: {
      onlyInteger: true,
    },
  };

  const type = 'Line';
  const chartRef = useRef<HTMLDivElement>(null);
  useChartTooltip(chartRef);

  return (
    <>
      <h2>净资产</h2>
      <i>资产减去负债</i>

      <Chart ref={chartRef}>
        <ChartistGraph data={data} options={options} type={type} />
      </Chart>
    </>
  );
};
