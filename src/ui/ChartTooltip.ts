import { useEffect } from 'react';

export const useChartTooltip = (containerRef: React.RefObject<HTMLDivElement>) => {
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const tooltip = document.createElement('div');
        tooltip.className = 'chart-tooltip';
        tooltip.style.opacity = '0';
        tooltip.style.position = 'absolute';
        tooltip.style.pointerEvents = 'none'; // Ensure tooltip doesn't block mouse events
        document.body.appendChild(tooltip);

        const showTooltip = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            if (
                target.classList.contains('ct-point') ||
                target.classList.contains('ct-bar') ||
                target.classList.contains('ct-slice-donut') ||
                target.classList.contains('ct-slice-pie')
            ) {
                const metaStr = target.getAttribute('ct:meta');
                const valueStr = target.getAttribute('ct:value');

                if (!metaStr) return;

                let meta: { account: string; date: string } | null = null;
                try {
                    meta = JSON.parse(metaStr);
                } catch (err) {
                    console.error('Failed to parse chart tooltip meta', err);
                    return;
                }

                if (!meta) return;

                let content = `
                  <div class="tooltip-date">${meta.date}</div>
                  <div class="tooltip-account">${meta.account}</div>
                  <div class="tooltip-value">${valueStr}</div>
                `;

                tooltip.innerHTML = content;
                tooltip.style.opacity = '1';
                tooltip.style.left = e.pageX + 10 + 'px';
                tooltip.style.top = e.pageY + 10 + 'px';
                tooltip.style.zIndex = '10000'; // Ensure it's on top
            }
        };

        const hideTooltip = () => {
            tooltip.style.opacity = '0';
        };

        const moveTooltip = (e: MouseEvent) => {
            if (tooltip.style.opacity === '1') {
                tooltip.style.left = e.pageX + 10 + 'px';
                tooltip.style.top = e.pageY + 10 + 'px';
            }
        }

        container.addEventListener('mouseover', showTooltip);
        container.addEventListener('mouseout', hideTooltip);
        container.addEventListener('mousemove', moveTooltip);

        return () => {
            container.removeEventListener('mouseover', showTooltip);
            container.removeEventListener('mouseout', hideTooltip);
            container.removeEventListener('mousemove', moveTooltip);
            if (document.body.contains(tooltip)) {
                document.body.removeChild(tooltip);
            }
        };
    }, [containerRef]);
};
