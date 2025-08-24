/**
 * @file This file re-exports the stable Notebook functions.
 * It acts as a clean, logic-free interface to the core functionality,
 * as required by the project's architecture.
 */

export {
  Notebook_v1_readFile,
  Notebook_v1_saveFile,
} from '../../function/stable/file/NotebookFunctions_v1_main';
