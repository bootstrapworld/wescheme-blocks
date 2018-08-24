export const reducer = (
  state = {
    selections: [],
    ast: null,
    focusId: -1,
    cm: null,
    parser: null,
    collapsedList: [],
    errorId: '',
  },
  action) => {
    switch (action.type) {
    case 'SET_FOCUS':
      return {...state, focusId: action.focusId};
    case 'SET_AST':
      return {...state, ast: action.ast};
    case 'SET_CM':
      return {...state, cm: action.cm};
    case 'SET_SELECTIONS':
      return {...state, selections: action.selections};
    case 'SET_PARSER':
      return {...state, parser: action.parser};
    case 'SET_ERROR_ID':
      return {...state, errorId: action.errorId};
    case 'COLLAPSE':
      return {...state, collapsedList: state.collapsedList.concat([action.id])};
    case 'UNCOLLAPSE':
      return {...state, collapsedList: state.collapsedList.filter(e => e !== action.id)};
    case 'COLLAPSE_ALL':
      return {...state, collapsedList: [...state.ast.nodeIdMap.keys()]};
    case 'UNCOLLAPSE_ALL':
      return {...state, collapsedList: []};
    default:
      return state;
    }
  };
