import { Moment } from 'moment';
import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 24px;
  color: var(--text-normal);
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const MonthDisplay = styled.span`
  font-size: 16px;
  color: var(--text-normal);
  font-weight: 500;
  min-width: 120px;
  text-align: center;
`;

const Button = styled.button<{ disabled: boolean }>`
  padding: 6px 12px;
  background: ${(props) =>
        props.disabled ? 'var(--background-modifier-border)' : 'var(--interactive-accent)'};
  color: ${(props) =>
        props.disabled ? 'var(--text-muted)' : 'var(--text-on-accent)'};
  border: none;
  border-radius: 4px;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  font-size: 13px;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};

  &:hover {
    background: ${(props) =>
        props.disabled
            ? 'var(--background-modifier-border)'
            : 'var(--interactive-accent-hover)'};
  }
`;

interface MonthSelectorProps {
    selectedMonth: Moment;
    onMonthChange: (month: Moment) => void;
    canGoPrev: boolean;
    canGoNext: boolean;
    onBack?: () => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
    selectedMonth,
    onMonthChange,
    canGoPrev,
    canGoNext,
    onBack,
}) => {
    const handlePrevMonth = () => {
        if (canGoPrev) {
            onMonthChange(selectedMonth.clone().subtract(1, 'month'));
        }
    };

    const handleNextMonth = () => {
        if (canGoNext) {
            onMonthChange(selectedMonth.clone().add(1, 'month'));
        }
    };

    return (
        <Container>
            <Title>Financial Report</Title>
            <Controls>
                {onBack && (
                    <Button disabled={false} onClick={onBack}>
                        Back to Ledger
                    </Button>
                )}
                <Button disabled={!canGoPrev} onClick={handlePrevMonth}>
                    ← Previous Month
                </Button>
                <MonthDisplay>{selectedMonth.format('YYYY/MM')}</MonthDisplay>
                <Button disabled={!canGoNext} onClick={handleNextMonth}>
                    Next Month →
                </Button>
            </Controls>
        </Container>
    );
};
