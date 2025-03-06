export const getNearestIndicator = (e: React.DragEvent<HTMLDivElement>, indicators: HTMLElement[]) => {
    const DISTANCE_OFFSET=50;
    const el = indicators.reduce(
        (closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = e.clientY - (box.top + DISTANCE_OFFSET);
            if(offset < 0 && offset > closest.offset) {
                return {offset: offset, element: child};
            } else {
                return closest;
            }
        },
        {
            offset: Number.NEGATIVE_INFINITY,
            element: indicators[indicators.length - 1],
        }
    );
    return el;
}
export const highlightIndicator = (e: React.DragEvent<HTMLDivElement>, column: string) => {
    const indicators = getIndicators(column);
    clearHighlights(column,indicators);
    const el = getNearestIndicator(e, indicators);
    el.element.style.opacity = "1";
};

export const clearHighlights = (column: string,els?: HTMLElement[]) => {
    const indicators = els || getIndicators(column);
    indicators.forEach((i)=>{
        i.style.opacity = "0";
    })
}

export const getIndicators = (column: string) => {
    return Array.from(document.querySelectorAll(`[data-column="${column}"]`)) as HTMLElement[];
}