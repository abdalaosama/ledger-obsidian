import { Interval } from '../date-utils';
import {
  Button,
  DatePicker,
  FlexContainer,
  FlexFloatRight,
  FlexShrink,
} from './SharedStyles';
import { Moment } from 'moment';
import { Notice } from 'obsidian';
import React from 'react';
import styled from 'styled-components';

const MarginSpan = styled.span`
  margin: 0 12px;
`;

export const DateRangeSelector: React.FC<{
  startDate: Moment;
  endDate: Moment;
  setStartDate: React.Dispatch<React.SetStateAction<Moment>>;
  setEndDate: React.Dispatch<React.SetStateAction<Moment>>;
  interval: Interval;
  setInterval: React.Dispatch<React.SetStateAction<Interval>>;
}> = (props): JSX.Element => (
  <FlexContainer>
    <FlexFloatRight className="ledger-interval-selectors">
      <Button
        selected={props.interval === 'day'}
        action={() => {
          props.setInterval('day');
          props.setStartDate(window.moment().subtract(30, 'days'));
          props.setEndDate(window.moment());
        }}
      >
        Daily View
      </Button>
      <Button
        selected={props.interval === 'week'}
        action={() => {
          props.setInterval('week');
          props.setStartDate(window.moment().subtract(3, 'weeks').startOf('isoWeek'));
          props.setEndDate(window.moment());
        }}
      >
        Weekly View
      </Button>
      <Button
        selected={props.interval === 'month'}
        action={() => {
          props.setInterval('month');
          props.setStartDate(window.moment().subtract(1, 'year').startOf('month'));
          props.setEndDate(window.moment());
        }}
      >
        Monthly View
      </Button>
    </FlexFloatRight>
  </FlexContainer>
);


