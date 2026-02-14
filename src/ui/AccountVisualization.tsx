import {
  makeBalanceData,
  makeDailyAccountBalanceChangeMap,
  makeDeltaData,
  removeDuplicateAccounts,
} from '../balance-utils';
import { Interval, makeBucketNames } from '../date-utils';
import { IBarChartOptions, ILineChartOptions } from 'chartist';
import { Moment } from 'moment';
import React, { useRef } from 'react';
import ChartistGraph from 'react-chartist';
import styled from 'styled-components';
import { useChartTooltip } from './ChartTooltip';
import { ISettings } from '../settings';

const ChartHeader = styled.div`
  display: flex;
`;

const Legend = styled.div`
  margin-left: auto;
  flex-shrink: 1;
`;

const ChartTypeSelector = styled.div`
  flex-shrink: 1;
  flex-grow: 0;
`;

const Chart = styled.div`
  .ct-label {
    color: var(--text-muted);
  }
`;

export const AccountVisualization: React.FC<{
  dailyAccountBalanceMap: Map<string, Map<string, number>>;
  allAccounts: string[];
  selectedAccounts: string[];
  startDate: Moment;
  endDate: Moment;
  interval: Interval;
  settings: ISettings;
}> = (props): JSX.Element => {
  const [mode, setMode] = React.useState(props.settings.defaultChartMode);

  const filteredAccounts = removeDuplicateAccounts(props.selectedAccounts);
  const dateBuckets = makeBucketNames(
    props.interval,
    props.startDate,
    props.endDate,
  );

  const visualization =
    mode === 'balance' ? (
      <BalanceVisualization
        dailyAccountBalanceMap={props.dailyAccountBalanceMap}
        allAccounts={props.allAccounts}
        accounts={filteredAccounts}
        dateBuckets={dateBuckets}
        interval={props.interval}
        adaptiveYAxis={props.settings.chartAdaptiveYAxis}
      />
    ) : (
      <DeltaVisualization
        dailyAccountBalanceMap={props.dailyAccountBalanceMap}
        allAccounts={props.allAccounts}
        accounts={filteredAccounts}
        dateBuckets={dateBuckets}
        startDate={props.startDate}
        interval={props.interval}
        adaptiveYAxis={props.settings.chartAdaptiveYAxis}
      />
    );

  return (
    <>
      <ChartHeader>
        <ChartTypeSelector>
          <select
            className="dropdown"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as 'balance' | 'pnl');
            }}
          >
            <option value="balance">Account Balance</option>
            <option value="pnl">Profit & Loss</option>
          </select>
        </ChartTypeSelector>
        <Legend>
          <ul className="ct-legend">
            {filteredAccounts.map((account, i) => (
              <li key={account} className={`ct-series-${i}`}>
                {account}
              </li>
            ))}
          </ul>
        </Legend>
      </ChartHeader>
      <Chart>{visualization}</Chart>
    </>
  );
};

const BalanceVisualization: React.FC<{
  dailyAccountBalanceMap: Map<string, Map<string, number>>;
  allAccounts: string[];
  accounts: string[];
  dateBuckets: string[];
  interval: Interval;
  adaptiveYAxis: boolean;
}> = (props): JSX.Element => {
  const displayLabels = props.dateBuckets.map((date) => {
    const m = window.moment(date);
    if (props.interval === 'month') {
      return m.format('YYYY-MM');
    } else if (props.interval === 'week') {
      return m.format('YYYY[W]WW');
    } else {
      // Day view: show YYYY-MM-DD for January, otherwise MM-DD
      if (m.month() === 0) {
        return m.format('YYYY-MM-DD');
      }
      return m.format('MM-DD');
    }
  });

  const data = {
    labels: displayLabels,
    series: props.accounts.map((account) =>
      makeBalanceData(
        props.dailyAccountBalanceMap,
        props.dateBuckets,
        account,
        props.allAccounts,
      ),
    ),
  };

  // Calculate Y-axis range if adaptive is enabled
  let yAxisConfig = {};
  if (props.adaptiveYAxis && data.series.length > 0) {
    const allValues: number[] = [];
    data.series.forEach((series) => {
      series.forEach((point: any) => {
        if (typeof point.y === 'number') {
          allValues.push(point.y);
        }
      });
    });

    if (allValues.length > 0) {
      const minValue = Math.min(...allValues);
      const maxValue = Math.max(...allValues);
      const range = maxValue - minValue;
      const padding = range * 0.1; // 10% padding

      yAxisConfig = {
        low: Math.floor(minValue - padding),
        high: Math.ceil(maxValue + padding),
      };
    }
  }

  const options: ILineChartOptions = {
    height: '300px',
    width: '100%',
    showArea: false,
    showPoint: true,
    axisY: {
      onlyInteger: true,
    },
    ...yAxisConfig,
  };

  const chartRef = useRef<HTMLDivElement>(null);
  useChartTooltip(chartRef);

  return (
    <div ref={chartRef}>
      <ChartistGraph data={data} options={options} type="Line" />
    </div>
  );
};

const DeltaVisualization: React.FC<{
  dailyAccountBalanceMap: Map<string, Map<string, number>>;
  allAccounts: string[];
  accounts: string[];
  dateBuckets: string[];
  startDate: Moment;
  interval: Interval;
  adaptiveYAxis: boolean;
}> = (props): JSX.Element => {
  const displayLabels = props.dateBuckets.map((date) => {
    const m = window.moment(date);
    if (props.interval === 'month') {
      return m.format('YYYY-MM');
    } else if (props.interval === 'week') {
      return m.format('YYYY[W]WW');
    } else {
      // Day view: show YYYY-MM-DD for January, otherwise MM-DD
      if (m.month() === 0) {
        return m.format('YYYY-MM-DD');
      }
      return m.format('MM-DD');
    }
  });

  const data = {
    labels: displayLabels,
    series: props.accounts.map((account) =>
      makeDeltaData(
        props.dailyAccountBalanceMap,
        props.startDate
          .clone()
          .subtract(1, props.interval)
          .format('YYYY-MM-DD'),
        props.dateBuckets,
        account,
        props.allAccounts,
      ),
    ),
  };

  // Calculate Y-axis range if adaptive is enabled
  let yAxisConfig = {};
  if (props.adaptiveYAxis && data.series.length > 0) {
    const allValues: number[] = [];
    data.series.forEach((series) => {
      series.forEach((point: any) => {
        if (typeof point.y === 'number') {
          allValues.push(point.y);
        }
      });
    });

    if (allValues.length > 0) {
      const minValue = Math.min(...allValues);
      const maxValue = Math.max(...allValues);
      const range = maxValue - minValue;
      const padding = range * 0.1; // 10% padding

      yAxisConfig = {
        low: Math.floor(minValue - padding),
        high: Math.ceil(maxValue + padding),
      };
    }
  }

  const options: IBarChartOptions = {
    height: '300px',
    width: '100%',
    axisY: {
      onlyInteger: true,
    },
    ...yAxisConfig,
  };

  const chartRef = useRef<HTMLDivElement>(null);
  useChartTooltip(chartRef);

  return (
    <div ref={chartRef}>
      <ChartistGraph data={data} options={options} type="Bar" />
    </div>
  );
};
