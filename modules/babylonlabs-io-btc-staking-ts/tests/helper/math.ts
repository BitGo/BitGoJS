/**
 * Generates an array of random integers for each slice that sum up to the total amount.
 *
 * @param totalAmount - The total amount to be distributed across the slices (must be an integer).
 * @param numOfSlices - The number of slices (must be an integer).
 * @returns An array of integers representing the amount for each slice.
 */
export const generateRandomAmountSlices = (
  totalAmount: number,
  numOfSlices: number,
): number[] => {
  if (numOfSlices <= 0) {
    throw new Error("Number of slices must be greater than zero.");
  }

  const amounts: number[] = [];
  let remainingAmount = totalAmount;

  for (let i = 0; i < numOfSlices - 1; i++) {
    const max = Math.floor(remainingAmount / (numOfSlices - i));
    const amount = Math.floor(Math.random() * max);
    amounts.push(amount);
    remainingAmount -= amount;
  }

  // Push the remaining amount as the last slice amount
  amounts.push(remainingAmount);

  return amounts;
};
