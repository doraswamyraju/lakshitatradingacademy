import { AlgorithmType } from "../types";

export type SortStep = {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
};

function* bubbleSort(array: number[]): Generator<SortStep> {
  let arr = [...array];
  let n = arr.length;
  let sortedIndices: number[] = [];

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      yield { array: [...arr], comparing: [j, j + 1], swapping: [], sorted: [...sortedIndices] };
      
      if (arr[j] > arr[j + 1]) {
        // Swap
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        yield { array: [...arr], comparing: [], swapping: [j, j + 1], sorted: [...sortedIndices] };
      }
    }
    sortedIndices.push(n - i - 1);
    yield { array: [...arr], comparing: [], swapping: [], sorted: [...sortedIndices] };
  }
  // All sorted
  yield { array: [...arr], comparing: [], swapping: [], sorted: Array.from({length: n}, (_, i) => i) };
}

function* selectionSort(array: number[]): Generator<SortStep> {
  let arr = [...array];
  let n = arr.length;
  let sortedIndices: number[] = [];

  for (let i = 0; i < n; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      yield { array: [...arr], comparing: [minIdx, j], swapping: [], sorted: [...sortedIndices] };
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      let temp = arr[i];
      arr[i] = arr[minIdx];
      arr[minIdx] = temp;
      yield { array: [...arr], comparing: [], swapping: [i, minIdx], sorted: [...sortedIndices] };
    }
    sortedIndices.push(i);
    yield { array: [...arr], comparing: [], swapping: [], sorted: [...sortedIndices] };
  }
  yield { array: [...arr], comparing: [], swapping: [], sorted: Array.from({length: n}, (_, i) => i) };
}

function* insertionSort(array: number[]): Generator<SortStep> {
    let arr = [...array];
    let n = arr.length;
    let sortedIndices: number[] = []; // Insertion sort builds sorted sub-array at start, technically indices 0..i are relative sorted

    for (let i = 1; i < n; i++) {
        let key = arr[i];
        let j = i - 1;
        
        yield { array: [...arr], comparing: [i, j], swapping: [], sorted: [] };

        while (j >= 0 && arr[j] > key) {
            yield { array: [...arr], comparing: [j, j+1], swapping: [], sorted: [] };
            arr[j + 1] = arr[j];
            yield { array: [...arr], comparing: [], swapping: [j, j+1], sorted: [] };
            j = j - 1;
        }
        arr[j + 1] = key;
        yield { array: [...arr], comparing: [], swapping: [j+1], sorted: [] };
    }
    yield { array: [...arr], comparing: [], swapping: [], sorted: Array.from({length: n}, (_, i) => i) };
}

export const getAlgorithmGenerator = (type: AlgorithmType, array: number[]) => {
  switch (type) {
    case 'bubble': return bubbleSort(array);
    case 'selection': return selectionSort(array);
    case 'insertion': return insertionSort(array);
    default: return bubbleSort(array);
  }
};