import { observer } from "mobx-react";
import React, { createContext, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaCode } from "react-icons/fa";
import { RiCodeLine } from "react-icons/ri";
import AutoSizer from "react-virtualized-auto-sizer";
import { VariableSizeList } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import { useSDK } from "../../../providers/SDKProvider";
import { isDefined } from "../../../utils/utils";
import { Button } from "../Button/Button";
import { Icon } from "../Icon/Icon";
import { modal } from "../Modal/Modal";
import { Tooltip } from "../Tooltip/Tooltip";
import "./Table.scss";
import { TableCheckboxCell } from "./TableCheckbox";
import { TableBlock, TableContext, TableElem } from "./TableContext";
import { TableHead } from "./TableHead/TableHead";
import { TableRow } from "./TableRow/TableRow";
import { prepareColumns } from "./utils";
import { Block } from "../../../utils/bem";
import { FieldsButton } from "../FieldsButton";
import { LsGear, LsGearNewUI } from "../../../assets/icons";
import { FF_DEV_3873, FF_LOPS_E_10, FF_LOPS_E_3, isFF } from "../../../utils/feature-flags";
import { Component, getTaskStateExpandedForm, isValidNextTaskState, isValidTaskState, shouldShowComponent, TaskState } from '../../../../../../apps/labelstudio/src/utils/permission-utils';

const Decorator = (decoration) => {
  return {
    get(col) {
      return decoration.find((d) => {
        let found = false;

        if (isDefined(d.alias)) {
          found = d.alias === col.alias;
        } else if (d.resolver instanceof Function) {
          found = d.resolver(col);
        }
        return found;
      });
    },
  };
};

export const Table = observer(
  ({
    view,
    data,
    cellViews,
    selectedItems,
    focusedItem,
    decoration,
    stopInteractions,
    onColumnResize,
    onColumnReset,
    headerExtra,
    ...props
  }) => {
    const colOrderKey = "dm:columnorder";
    const tableHead = useRef();
    const [colOrder, setColOrder] = useState(JSON.parse(localStorage.getItem(colOrderKey)) ?? {});
    const listRef = useRef();
    const columns = prepareColumns(props.columns, props.hiddenColumns);
    const Decoration = useMemo(() => Decorator(decoration), [decoration]);
    const { api, type } = useSDK();

    useEffect(() => {
      localStorage.setItem(colOrderKey, JSON.stringify(colOrder));
    }, [colOrder]);

    if (props.onSelectAll && props.onSelectRow) {
      columns.unshift({
        id: "select",
        headerClassName: "table__select-all",
        cellClassName: "select-row",
        style: {
          width: 40,
          maxWidth: 40,
          justifyContent: "center",
        },
        onClick: (e) => e.stopPropagation(),
        Header: () => {
          return (
            <TableCheckboxCell
              checked={selectedItems.isAllSelected}
              indeterminate={selectedItems.isIndeterminate}
              onChange={() => props.onSelectAll()}
              className="select-all"
            />
          );
        },
        Cell: ({ data }) => {
          return (
            <TableCheckboxCell
              checked={selectedItems.isSelected(data.id)}
              onChange={() => props.onSelectRow(data.id)}
            />
          );
        },
      });
    }

    columns.push({
      id: "show-source",
      cellClassName: "show-source",
      style: {
        width: 40,
        maxWidth: 40,
        justifyContent: "center",
      },
      onClick: (e) => e.stopPropagation(),
      Header() {
        return <div style={{ width: 40 }} />;
      },
      Cell({ data }) {
        let out = JSON.parse(data.source ?? "{}");

        out = {
          id: out?.id,
          data: out?.data,
          annotations: out?.annotations,
          predictions: out?.predictions,
        };

        const onTaskLoad = async () => {
          if (isFF(FF_LOPS_E_3) && type === "DE") {
            return new Promise((resolve) => resolve(out));
          }
          const response = await api.task({ taskID: out.id });

          return response ?? {};
        };

        return (
          <Tooltip title="Show task source">
            <Button
              type="link"
              style={{ width: 32, height: 32, padding: 0 }}
              onClick={() => {
                modal({
                  title: `Source for task ${out?.id}`,
                  style: { width: 800 },
                  body: <TaskSourceView content={out} onTaskLoad={onTaskLoad} sdkType={type} />,
                });
              }}
              icon={
                isFF(FF_LOPS_E_10) ? (
                  <Icon icon={RiCodeLine} style={{ width: 24, height: 24 }} />
                ) : (
                  <Icon icon={FaCode} />
                )
              }
            />
          </Tooltip>
        );
      },
    });


    columns.push({
      id: "show-state",
      cellClassName: "show-state",
      style: {
        width: 200,
        maxWidth: 200,
        justifyContent: "center",
      },
      onClick: (e) => e.stopPropagation(),
      Header() {
        return <div style={{ width: 40 }} />;
      },
      Cell({data}) {
        let out = JSON.parse(data.source ?? "{}");
        console.log(`data = ${out}`);
        return (
          <div style={{
              display: "inline-flex",
              alignItems:"center",
              borderRadius: "9999px",
              border:"1px solid",
              padding:"0.125rem 0.625rem",
              fontSize:"0.75rem",
              fontWeight:"600",
              transition:"color 0.2s",
          }}>
          {getTaskStateExpandedForm(out.state)}
          </div>
        );
      },
    });


    columns.push({
      id: "change-state",
      cellClassName: "show-state",
      style: {
        width: 200,
        maxWidth: 200,
        justifyContent: "center",
      },
      onClick: (e) => e.stopPropagation(),
      Header() {
        return <div style={{ width: 40 }} />;
      },
      Cell({data}) {
        let out = JSON.parse(data.source ?? "{}");
        const taskState = isValidTaskState(out.state);

        const hasPermissionToApprove = shouldShowComponent(Component.TASK_APPROVED_BUTTON);
        const hasPermissionToReject = shouldShowComponent(Component.TASK_REJECTED_BUTTON);
        const showApproveButton = hasPermissionToApprove && isValidNextTaskState(isValidTaskState(out.state), TaskState.APPROVED);
        const showRejectButton = hasPermissionToReject && isValidNextTaskState(isValidTaskState(out.state), TaskState.REJECTED);

        if(!showApproveButton && !showRejectButton){
          return <></>
        }

        // Inline CSS styles for buttons
        const buttonStyle = {
          padding: '10px 12px',
          fontSize:"0.75rem",
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          margin: '0 10px',
          color: '#fff',
        };

        const approveStyle = {
          ...buttonStyle,
          backgroundColor: '#4CAF50', // Green
        };

        const rejectStyle = {
          ...buttonStyle,
          backgroundColor: '#f44336', // Red
        };

        const containerStyle = {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        };

        const [action, setAction] = useState(null);

        useEffect(()=>{
          if(!action){
            return;
          }
          (async()=>{
            await api.taskState({ taskID: out.id }, {
              body: {
                state: action,
              },
            });
            window.location.reload()
            setAction(null);
          })()
        }, [action])

        return (
          <div style={containerStyle}>
          {showApproveButton && <button
            style={approveStyle}
            disabled={action!==null}
            onClick={()=>{
              setAction(TaskState.APPROVED);
            }}
            >
              Approve
          </button>}
          {showRejectButton && <button
            style={rejectStyle}
            disabled={action!==null}
            onClick={()=>{
              setAction(TaskState.REJECTED);
            }}
            >
              Reject
            </button>
          }
          </div>
        );
      },
    });


    if (Object.keys(colOrder).length > 0) {
      columns.sort((a, b) => {
        return colOrder[a.id] < colOrder[b.id] ? -1 : 1;
      });
    }

    const contextValue = {
      columns,
      data,
      cellViews,
    };

    const headerHeight = 43;

    const renderTableHeader = useCallback(
      ({ style }) => (
        <TableHead
          ref={tableHead}
          style={style}
          order={props.order}
          columnHeaderExtra={props.columnHeaderExtra}
          sortingEnabled={props.sortingEnabled}
          onSetOrder={props.onSetOrder}
          stopInteractions={stopInteractions}
          onTypeChange={props.onTypeChange}
          decoration={Decoration}
          onResize={onColumnResize}
          onReset={onColumnReset}
          extra={headerExtra}
          onDragEnd={(updatedColOrder) => setColOrder(updatedColOrder)}
        />
      ),
      [
        props.order,
        props.columnHeaderExtra,
        props.sortingEnabled,
        props.onSetOrder,
        props.onTypeChange,
        stopInteractions,
        view,
        view.selected.list,
        view.selected.all,
        tableHead,
      ],
    );

    const renderRow = useCallback(
      ({ style, index }) => {
        const row = data[index - 1];
        const isEven = index % 2 === 0;

        return (
          <TableRow
            key={row.id}
            data={row}
            even={isEven}
            onClick={(row, e) => props.onRowClick(row, e)}
            stopInteractions={stopInteractions}
            wrapperStyle={style}
            style={{
              height: props.rowHeight,
              width: props.fitContent ? "fit-content" : "auto",
            }}
            decoration={Decoration}
          />
        );
      },
      [
        data,
        props.fitContent,
        props.onRowClick,
        props.rowHeight,
        stopInteractions,
        selectedItems,
        view,
        view.selected.list,
        view.selected.all,
      ],
    );

    const isItemLoaded = useCallback(
      (index) => {
        return props.isItemLoaded(data, index);
      },
      [props, data],
    );

    const cachedScrollOffset = useRef();

    const initialScrollOffset = useCallback((height) => {
      if (isDefined(cachedScrollOffset.current)) {
        return cachedScrollOffset.current;
      }

      const { rowHeight: h } = props;
      const index = data.indexOf(focusedItem);

      if (index >= 0) {
        const scrollOffset = index * h - height / 2 + h / 2; // + headerHeight

        return (cachedScrollOffset.current = scrollOffset);
      }
      return 0;
    }, []);

    const itemKey = useCallback(
      (index) => {
        if (index > data.length - 1) {
          return index;
        }
        return data[index]?.key ?? index;
      },
      [data],
    );

    useEffect(() => {
      const listComponent = listRef.current?._listRef;

      if (listComponent) {
        listComponent.scrollToItem(data.indexOf(focusedItem), "center");
      }
    }, [data]);
    const tableWrapper = useRef();

    const right =
      tableWrapper.current?.firstChild?.firstChild.offsetWidth -
        tableWrapper.current?.firstChild?.firstChild?.firstChild.offsetWidth || 0;

    return (
      <>
        {view.root.isLabeling && (
          <Block
            name="columns__selector"
            style={{
              right,
            }}
          >
            {isFF(FF_DEV_3873) ? (
              <FieldsButton
                className={"columns__selector__button-new"}
                wrapper={FieldsButton.Checkbox}
                icon={<LsGearNewUI />}
                style={{ padding: "0" }}
                tooltip={"Customize Columns"}
              />
            ) : (
              <FieldsButton
                wrapper={FieldsButton.Checkbox}
                icon={<LsGear />}
                style={{
                  padding: 0,
                  zIndex: 1000,
                  borderRadius: 0,
                  height: "45px",
                  width: "45px",
                  margin: "-1px",
                }}
              />
            )}
          </Block>
        )}
        <TableBlock ref={tableWrapper} name="table" mod={{ fit: props.fitToContent }}>
          <TableContext.Provider value={contextValue}>
            <StickyList
              ref={listRef}
              overscanCount={10}
              itemHeight={props.rowHeight}
              totalCount={props.total}
              itemCount={data.length + 1}
              itemKey={itemKey}
              innerElementType={innerElementType}
              stickyItems={[0]}
              stickyItemsHeight={[headerHeight]}
              stickyComponent={renderTableHeader}
              initialScrollOffset={initialScrollOffset}
              isItemLoaded={isItemLoaded}
              loadMore={props.loadMore}
            >
              {renderRow}
            </StickyList>
          </TableContext.Provider>
        </TableBlock>
      </>
    );
  },
);

const StickyListContext = createContext();

StickyListContext.displayName = "StickyListProvider";

const ItemWrapper = ({ data, index, style }) => {
  const { Renderer, stickyItems } = data;

  if (stickyItems?.includes(index) === true) {
    return null;
  }

  return <Renderer index={index} style={style} />;
};

const StickyList = observer(
  forwardRef((props, listRef) => {
    const {
      children,
      stickyComponent,
      stickyItems,
      stickyItemsHeight,
      totalCount,
      isItemLoaded,
      loadMore,
      initialScrollOffset,
      ...rest
    } = props;

    const itemData = {
      Renderer: children,
      StickyComponent: stickyComponent,
      stickyItems,
      stickyItemsHeight,
    };

    const itemSize = (index) => {
      if (stickyItems.includes(index)) {
        return stickyItemsHeight[index] ?? rest.itemHeight;
      }
      return rest.itemHeight;
    };

    return (
      <StickyListContext.Provider value={itemData}>
        <TableElem tag={AutoSizer} name="auto-size">
          {({ width, height }) => (
            <InfiniteLoader
              ref={listRef}
              itemCount={totalCount}
              loadMoreItems={loadMore}
              isItemLoaded={isItemLoaded}
              threshold={5}
              minimumBatchSize={30}
            >
              {({ onItemsRendered, ref }) => (
                <TableElem
                  name="virual"
                  tag={VariableSizeList}
                  {...rest}
                  ref={ref}
                  width={width}
                  height={height}
                  itemData={itemData}
                  itemSize={itemSize}
                  onItemsRendered={onItemsRendered}
                  initialScrollOffset={initialScrollOffset?.(height) ?? 0}
                >
                  {ItemWrapper}
                </TableElem>
              )}
            </InfiniteLoader>
          )}
        </TableElem>
      </StickyListContext.Provider>
    );
  }),
);

StickyList.displayName = "StickyList";

const innerElementType = forwardRef(({ children, ...rest }, ref) => {
  return (
    <StickyListContext.Consumer>
      {({ stickyItems, stickyItemsHeight, StickyComponent }) => (
        <div ref={ref} {...rest}>
          {stickyItems.map((index) => (
            <TableElem
              name="sticky-header"
              tag={StickyComponent}
              key={index}
              index={index}
              style={{
                height: stickyItemsHeight[index],
                top: index * stickyItemsHeight[index],
              }}
            />
          ))}

          {children}
        </div>
      )}
    </StickyListContext.Consumer>
  );
});

const TaskSourceView = ({ content, onTaskLoad, sdkType }) => {
  const [source, setSource] = useState(content);

  useEffect(() => {
    onTaskLoad().then((response) => {
      const formatted = {
        id: response.id,
        data: response.data,
      };

      if (sdkType !== "DE") {
        formatted.annotations = response.annotations ?? [];
        formatted.predictions = response.predictions ?? [];
      }
      setSource(formatted);
    });
  }, []);

  return <pre>{source ? JSON.stringify(source, null, "  ") : null}</pre>;
};
