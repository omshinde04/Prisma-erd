import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MiniMap,
  Panel,
  Position,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

import { estimateNodeHeight, layoutGraph } from "../lib/elk-layout.js";
import { mapGraphToReactFlow } from "../lib/react-flow-mapper.js";

const HANDLE_SIDES = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
];

function EntityHandles() {
  return (
    <>
      {HANDLE_SIDES.map((side) => (
        <Handle
          key={`${side}-source`}
          type="source"
          position={side}
          id={`${side}-source`}
          className="diagram-node__handle"
        />
      ))}
      {HANDLE_SIDES.map((side) => (
        <Handle
          key={`${side}-target`}
          type="target"
          position={side}
          id={`${side}-target`}
          className="diagram-node__handle"
        />
      ))}
    </>
  );
}

function renderFieldRows(fields, emptyMessage, collapsed) {
  if (!fields || fields.length === 0) {
    return <div className="diagram-node__empty">{emptyMessage}</div>;
  }

  const visibleFields = collapsed ? fields.slice(0, 6) : fields;

  return (
    <>
      {visibleFields.map((field) => {
        const indicator = field.isPrimaryKey
          ? "🔑"
          : field.isForeignKey
            ? "↗"
            : field.isRelation
              ? "⇄"
              : field.isOptional
                ? "○"
                : "•";

        return (
          <div
            key={`${field.name}-${field.typeLabel}`}
            className={`diagram-field-row${field.isPrimaryKey ? " diagram-field-row--pk" : ""}${field.isForeignKey ? " diagram-field-row--fk" : ""}${field.isRelation ? " diagram-field-row--relation" : ""}${field.isOptional ? " diagram-field-row--nullable" : ""}`}
          >
            <div className="diagram-field-row__indicator">{indicator}</div>
            <div className="diagram-field-row__name">{field.name}</div>
            <div className="diagram-field-row__type">{field.typeLabel}</div>
            <div className="diagram-field-row__attributes">
              {field.attributes?.length ? field.attributes.join(" ") : "—"}
            </div>
            <div className="diagram-field-row__badges">
              {field.badges.map((badge) => (
                <span
                  key={`${field.name}-${badge}`}
                  className={`diagram-badge diagram-badge--${badge.toLowerCase()}`}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        );
      })}
      {collapsed && fields.length > visibleFields.length ? (
        <div className="diagram-node__collapsed-hint">
          +{fields.length - visibleFields.length} more fields
        </div>
      ) : null}
    </>
  );
}

function renderEnumRows(values) {
  if (!values || values.length === 0) {
    return <div className="diagram-node__empty">No enum values</div>;
  }

  return values.map((value) => (
    <div key={value} className="diagram-enum-row">
      <span className="diagram-enum-row__bullet">◇</span>
      <span>{value}</span>
    </div>
  ));
}

function renderFooterList(items, emptyLabel) {
  if (!items?.length) {
    return <div className="diagram-node__footer-empty">{emptyLabel}</div>;
  }

  return items.map((item) => (
    <div key={item} className="diagram-node__footer-item">
      {item}
    </div>
  ));
}

function DiagramNode({ data, selected }) {
  const sections = data.sections ?? [];

  return (
    <div
      className={`${data.className}${selected ? " diagram-node--selected" : ""}`}
    >
      <EntityHandles />
      <div className="diagram-node__header">
        <div className="diagram-node__title-row">
          <div className="diagram-node__title-block">
            <div className="diagram-node__title">{data.label}</div>
            {data.mappedName ? (
              <div className="diagram-node__mapped-name">{data.mappedName}</div>
            ) : null}
          </div>
          <span className="diagram-node__kind">{data.subtitle}</span>
        </div>
        {data.meta ? (
          <div className="diagram-node__meta">{data.meta}</div>
        ) : null}
      </div>

      <div className="diagram-node__body diagram-node__body--sectioned">
        {data.subtitle === "enum"
          ? renderEnumRows(data.enumValues)
          : sections.map((section) => (
              <section key={section.id} className="diagram-section">
                <div className="diagram-section__header">{section.title}</div>
                {section.id === "columns" ? (
                  <div className="diagram-field-row diagram-field-row--table-head">
                    <div className="diagram-field-row__indicator">#</div>
                    <div className="diagram-field-row__name">Field</div>
                    <div className="diagram-field-row__type">Type</div>
                    <div className="diagram-field-row__attributes">
                      Attributes
                    </div>
                    <div className="diagram-field-row__badges">Keys</div>
                  </div>
                ) : null}
                <div className="diagram-section__body">
                  {renderFieldRows(
                    section.fields,
                    section.emptyMessage,
                    section.collapsed,
                  )}
                </div>
              </section>
            ))}
      </div>

      {data.footer ? (
        <div className="diagram-node__footer">
          <div className="diagram-node__footer-section">
            <div className="diagram-node__footer-title">Indexes</div>
            {renderFooterList(data.footer.indexes, "No indexes")}
          </div>
          <div className="diagram-node__footer-section">
            <div className="diagram-node__footer-title">Unique constraints</div>
            {renderFooterList(data.footer.uniques, "No unique constraints")}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getCardinalityLabel(data, side) {
  if (data.relationKind === "many-to-many") {
    return "∞";
  }

  if (data.constraintType !== "explicit") {
    if (side === "source") {
      return data.arity === "many" ? "1" : data.isOptional ? "0..1" : "1";
    }

    return data.arity === "many" ? "∞" : "1";
  }

  // For explicit foreign keys, "source" is always the table owning the
  // referenced primary key, and "target" is the table owning the foreign key.
  if (side === "source") {
    return "1";
  }

  if (data.arity === "many") {
    return data.isOptional ? "0..∞" : "∞";
  }

  return data.isOptional ? "0..1" : "1";
}

function getStraightSegmentPath(points) {
  if (!points.length) {
    return "";
  }

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

function createOrthogonalPoints(
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourceSide,
  targetSide,
) {
  if (sourceSide === Position.Right || sourceSide === Position.Left) {
    const midX = sourceX + (targetX - sourceX) / 2;
    return [
      { x: sourceX, y: sourceY },
      { x: midX, y: sourceY },
      { x: midX, y: targetY },
      { x: targetX, y: targetY },
    ];
  }

  if (sourceSide === Position.Top || sourceSide === Position.Bottom) {
    const midY = sourceY + (targetY - sourceY) / 2;
    return [
      { x: sourceX, y: sourceY },
      { x: sourceX, y: midY },
      { x: targetX, y: midY },
      { x: targetX, y: targetY },
    ];
  }

  if (targetSide === Position.Top || targetSide === Position.Bottom) {
    const midY = sourceY + (targetY - sourceY) / 2;
    return [
      { x: sourceX, y: sourceY },
      { x: sourceX, y: midY },
      { x: targetX, y: midY },
      { x: targetX, y: targetY },
    ];
  }

  const midX = sourceX + (targetX - sourceX) / 2;
  return [
    { x: sourceX, y: sourceY },
    { x: midX, y: sourceY },
    { x: midX, y: targetY },
    { x: targetX, y: targetY },
  ];
}

function getAnchorPosition(sourceX, sourceY, targetX, targetY) {
  const deltaX = targetX - sourceX;
  const deltaY = targetY - sourceY;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX >= 0
      ? { sourceSide: Position.Right, targetSide: Position.Left }
      : { sourceSide: Position.Left, targetSide: Position.Right };
  }

  return deltaY >= 0
    ? { sourceSide: Position.Bottom, targetSide: Position.Top }
    : { sourceSide: Position.Top, targetSide: Position.Bottom };
}

function ArrowHead({ x, y, direction, color }) {
  const size = 6;
  const pointsByDirection = {
    right: `${x - size},${y - size} ${x},${y} ${x - size},${y + size}`,
    left: `${x + size},${y - size} ${x},${y} ${x + size},${y + size}`,
    down: `${x - size},${y - size} ${x},${y} ${x + size},${y - size}`,
    up: `${x - size},${y + size} ${x},${y} ${x + size},${y + size}`,
  };

  return (
    <polyline
      points={pointsByDirection[direction]}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function ConnectionPort({ x, y, color }) {
  return (
    <circle
      cx={x}
      cy={y}
      r="4.5"
      fill="#020617"
      stroke={color}
      strokeWidth="2"
    />
  );
}

function getArrowDirection(previousPoint, point) {
  if (point.x > previousPoint.x) {
    return "right";
  }

  if (point.x < previousPoint.x) {
    return "left";
  }

  if (point.y > previousPoint.y) {
    return "down";
  }

  return "up";
}

function RelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style,
  label,
  selected,
}) {
  const theme = data.relationTheme;
  const strokeColor = style?.stroke ?? "#67e8f9";
  const { sourceSide, targetSide } = getAnchorPosition(
    sourceX,
    sourceY,
    targetX,
    targetY,
  );
  const points = createOrthogonalPoints(
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourceSide,
    targetSide,
  );
  const edgePath = getStraightSegmentPath(points);
  const centerPoint = points[Math.floor(points.length / 2)] ?? {
    x: (sourceX + targetX) / 2,
    y: (sourceY + targetY) / 2,
  };
  const previousPoint = points[points.length - 2] ?? { x: sourceX, y: sourceY };
  const arrowDirection = getArrowDirection(
    previousPoint,
    points[points.length - 1] ?? previousPoint,
  );

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          strokeWidth: selected
            ? (style?.strokeWidth ?? 2) + 1
            : style?.strokeWidth,
          filter: selected ? `drop-shadow(0 0 10px ${strokeColor})` : undefined,
        }}
      />

      <svg className="diagram-edge-markers" aria-hidden="true">
        <ConnectionPort x={sourceX} y={sourceY} color={strokeColor} />
        <ConnectionPort x={targetX} y={targetY} color={strokeColor} />
        <ArrowHead
          x={targetX}
          y={targetY}
          direction={arrowDirection}
          color={strokeColor}
        />
      </svg>

      <EdgeLabelRenderer>
        <div
          className={`${theme?.labelClassName ?? "diagram-edge-label"}${selected ? " diagram-edge-label--selected" : ""}`}
          style={{
            transform: `translate(-50%, -50%) translate(${centerPoint.x}px, ${centerPoint.y}px)`,
          }}
        >
          <div className="diagram-edge-label__title">{label}</div>
          <div className="diagram-edge-label__meta">
            <span className="diagram-edge-label__badge">
              {theme?.badge ?? "REL"}
            </span>
            <span>{getCardinalityLabel(data, "source")}</span>
            <span className="diagram-edge-label__arrow">→</span>
            <span>{getCardinalityLabel(data, "target")}</span>
          </div>
          {data.fieldMapping ? (
            <div className="diagram-edge-label__mapping">
              {data.fieldMapping}
            </div>
          ) : null}
          <div className="diagram-edge-label__constraint">
            {data.constraintText}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const nodeTypes = {
  entity: DiagramNode,
};

const edgeTypes = {
  relation: RelationEdge,
};

function getNodeCenter(node) {
  const width = Number(node.style?.width ?? 360);
  const height = estimateNodeHeight(node);

  return {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2,
  };
}

function computeHandleAssignment(sourceNode, targetNode) {
  if (!sourceNode || !targetNode) {
    return {
      sourceHandle: `${Position.Right}-source`,
      targetHandle: `${Position.Left}-target`,
    };
  }

  if (sourceNode.id === targetNode.id) {
    return {
      sourceHandle: `${Position.Bottom}-source`,
      targetHandle: `${Position.Top}-target`,
    };
  }

  const sourceCenter = getNodeCenter(sourceNode);
  const targetCenter = getNodeCenter(targetNode);
  const deltaX = targetCenter.x - sourceCenter.x;
  const deltaY = targetCenter.y - sourceCenter.y;

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0
      ? {
          sourceHandle: `${Position.Right}-source`,
          targetHandle: `${Position.Left}-target`,
        }
      : {
          sourceHandle: `${Position.Left}-source`,
          targetHandle: `${Position.Right}-target`,
        };
  }

  return deltaY >= 0
    ? {
        sourceHandle: `${Position.Bottom}-source`,
        targetHandle: `${Position.Top}-target`,
      }
    : {
        sourceHandle: `${Position.Top}-source`,
        targetHandle: `${Position.Bottom}-target`,
      };
}

function SearchPanel({
  searchTerm,
  onSearchChange,
  onClear,
  onFocus,
  resultCount,
}) {
  return (
    <div className="diagram-search">
      <div className="diagram-search__title">Search & focus</div>
      <div className="diagram-search__row">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Find model, enum, field"
          className="diagram-search__input"
        />
      </div>
      <div className="diagram-search__actions">
        <button
          type="button"
          className="diagram-toolbar__button"
          onClick={onFocus}
        >
          Focus match
        </button>
        <button
          type="button"
          className="diagram-toolbar__button"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
      <div className="diagram-search__meta">{resultCount} matching nodes</div>
    </div>
  );
}

function DiagramCanvasInner({ result, status, exportRef }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLayingOut, setIsLayingOut] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [collapsedRelationGroups, setCollapsedRelationGroups] = useState(false);
  const { fitView, setCenter } = useReactFlow();

  const mappedGraph = useMemo(() => {
    if (!result) {
      return null;
    }

    return mapGraphToReactFlow(result.graph);
  }, [result]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const searchMatchedNodeIds = useMemo(() => {
    if (!mappedGraph || !normalizedSearch) {
      return new Set();
    }

    return new Set(
      mappedGraph.nodes
        .filter((node) => {
          const sections = node.data.sections ?? [];
          const fields = sections.flatMap((section) => section.fields ?? []);
          const enumValues = node.data.enumValues ?? [];

          return [
            node.data.label,
            node.data.mappedName,
            ...fields.map((field) => field.name),
            ...fields.map((field) => field.typeLabel),
            ...enumValues,
          ]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalizedSearch));
        })
        .map((node) => node.id),
    );
  }, [mappedGraph, normalizedSearch]);

  useEffect(() => {
    let cancelled = false;

    async function applyLayout() {
      if (!mappedGraph) {
        setNodes([]);
        setEdges([]);
        return;
      }

      setIsLayingOut(true);

      try {
        const graphForLayout = {
          ...mappedGraph,
          nodes: mappedGraph.nodes.map((node) => ({
            ...node,
            data: {
              ...node.data,
              sections: (node.data.sections ?? []).map((section) =>
                section.id === "relations"
                  ? { ...section, collapsed: collapsedRelationGroups }
                  : section,
              ),
            },
          })),
        };

        const layoutedGraph = await layoutGraph(graphForLayout);

        if (cancelled) {
          return;
        }

        setNodes(
          layoutedGraph.nodes.map((node) => {
            const isSearchMatch = searchMatchedNodeIds.has(node.id);
            const isSelected = node.id === selectedNodeId;
            const isDimmed =
              normalizedSearch.length > 0 &&
              !isSearchMatch &&
              node.id !== selectedNodeId;

            return {
              ...node,
              selected: isSelected,
              data: {
                ...node.data,
                className: `${node.data.className}${isSearchMatch ? " diagram-node--search-match" : ""}${isDimmed ? " diagram-node--dimmed" : ""}`,
              },
            };
          }),
        );

        const nodeById = new Map(
          layoutedGraph.nodes.map((node) => [node.id, node]),
        );

        setEdges(
          layoutedGraph.edges.map((edge) => {
            const linkedToSelection =
              edge.source === selectedNodeId || edge.target === selectedNodeId;
            const isSelected = edge.id === selectedEdgeId;
            const isDimmed = selectedNodeId
              ? !linkedToSelection && !isSelected
              : normalizedSearch
                ? !searchMatchedNodeIds.has(edge.source) &&
                  !searchMatchedNodeIds.has(edge.target)
                : false;
            const { sourceHandle, targetHandle } = computeHandleAssignment(
              nodeById.get(edge.source),
              nodeById.get(edge.target),
            );

            return {
              ...edge,
              sourceHandle,
              targetHandle,
              selected: isSelected || linkedToSelection,
              style: {
                ...edge.style,
                opacity: isDimmed
                  ? 0.16
                  : linkedToSelection || isSelected
                    ? 1
                    : 0.9,
              },
            };
          }),
        );
      } finally {
        if (!cancelled) {
          setIsLayingOut(false);
        }
      }
    }

    void applyLayout();

    return () => {
      cancelled = true;
    };
  }, [
    collapsedRelationGroups,
    mappedGraph,
    normalizedSearch,
    searchMatchedNodeIds,
    selectedEdgeId,
    selectedNodeId,
    setEdges,
    setNodes,
  ]);

  const handleNodeClick = useCallback(
    (_, node) => {
      setSelectedEdgeId(null);
      setSelectedNodeId((current) => (current === node.id ? null : node.id));
      void setCenter(node.position.x + 180, node.position.y + 120, {
        zoom: 1,
        duration: 320,
      });
    },
    [setCenter],
  );

  const handleEdgeClick = useCallback((_, edge) => {
    setSelectedNodeId(null);
    setSelectedEdgeId((current) => (current === edge.id ? null : edge.id));
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  const handleFocusFirstMatch = useCallback(() => {
    const firstMatch = nodes.find((node) => searchMatchedNodeIds.has(node.id));

    if (!firstMatch) {
      return;
    }

    setSelectedNodeId(firstMatch.id);
    setSelectedEdgeId(null);
    void setCenter(firstMatch.position.x + 180, firstMatch.position.y + 120, {
      zoom: 1,
      duration: 320,
    });
  }, [nodes, searchMatchedNodeIds, setCenter]);

  if (!result) {
    return (
      <div className="diagram-empty-state">
        <div className="diagram-empty-state__content">
          <h2 className="diagram-empty-state__title">Diagram canvas</h2>
          <p className="diagram-empty-state__description">
            Paste a Prisma schema, upload a file, or open a saved snapshot to
            preview models, enums, and relations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="diagram-card">
      <div className="diagram-card__header">
        <div>
          <h2 className="diagram-card__title">ERD Diagram</h2>
          <p className="diagram-card__description">
            Orthogonal database-style rendering with searchable tables, explicit
            relationship mapping, and dense-schema support.
          </p>
        </div>
        <span className="diagram-hint">
          {status === "loading" || isLayingOut
            ? "Laying out diagram…"
            : "Search, focus, pan, zoom, inspect"}
        </span>
      </div>

      <div className="diagram-flow" ref={exportRef}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onPaneClick={handlePaneClick}
          minZoom={0.06}
          maxZoom={2}
          fitView={false}
          panOnDrag
          panOnScroll
          panOnScrollSpeed={0.85}
          panOnScrollMode="free"
          onlyRenderVisibleElements
          selectionOnDrag
          elementsSelectable
          proOptions={{ hideAttribution: true }}
          translateExtent={[
            [-60000, -60000],
            [60000, 60000],
          ]}
          nodeExtent={[
            [-50000, -50000],
            [50000, 50000],
          ]}
        >
          <Panel position="top-left">
            <div className="diagram-toolbar">
              <button
                type="button"
                className="diagram-toolbar__button"
                onClick={() =>
                  fitView({
                    padding: 0.16,
                    duration: 320,
                    includeHiddenNodes: true,
                    maxZoom: 1,
                  })
                }
              >
                Fit diagram
              </button>
              <button
                type="button"
                className="diagram-toolbar__button"
                onClick={() =>
                  setCollapsedRelationGroups((currentValue) => !currentValue)
                }
              >
                {collapsedRelationGroups
                  ? "Expand relations"
                  : "Collapse relations"}
              </button>
            </div>
          </Panel>

          <Panel position="top-right">
            <SearchPanel
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onClear={() => setSearchTerm("")}
              onFocus={handleFocusFirstMatch}
              resultCount={searchMatchedNodeIds.size}
            />
            <div className="diagram-legend">
              <div className="diagram-legend__title">Relationships</div>
              <div className="diagram-legend__items">
                <div className="diagram-legend__item">
                  <span className="diagram-legend__swatch diagram-legend__swatch--fk-many" />
                  <span>Explicit FK 1:N</span>
                </div>
                <div className="diagram-legend__item">
                  <span className="diagram-legend__swatch diagram-legend__swatch--fk-one" />
                  <span>Explicit FK 1:1</span>
                </div>
                <div className="diagram-legend__item">
                  <span className="diagram-legend__swatch diagram-legend__swatch--many-to-many" />
                  <span>Many-to-many</span>
                </div>
                <div className="diagram-legend__item">
                  <span className="diagram-legend__swatch diagram-legend__swatch--self" />
                  <span>Self relation</span>
                </div>
                <div className="diagram-legend__item">
                  <span className="diagram-legend__swatch diagram-legend__swatch--implicit-many" />
                  <span>Implicit relation</span>
                </div>
              </div>
            </div>
          </Panel>

          <MiniMap pannable zoomable />
          <Controls showInteractive={false} />
          <Background gap={24} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}

export function DiagramCanvas(props) {
  return (
    <ReactFlowProvider>
      <DiagramCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
