/**
 * 8-bit Galois Field
 *
 * Copyright 2015, Backblaze, Inc.  All rights reserved.
 */

/**
 * 8-bit Galois Field
 *
 * This class implements multiplication, division, addition,
 * subtraction, and exponentiation.
 *
 * The multiplication operation is in the inner loop of
 * erasure coding, so it's been optimized.  Having the
 * class be "final" helps a little, and having the EXP_TABLE
 * repeat the data, so there's no need to bound the sum
 * of two logarithms to 255 helps a lot.
 */

class Galois {

    /**
     * The number of elements in the field.
     */

    static FIELD_SIZE = 256;

    /**
     * The polynomial used to generate the logarithm table.
     *
     * There are a number of polynomials that work to generate
     * a Galois field of 256 elements.  The choice is arbitrary,
     * and we just use the first one.
     *
     * The possibilities are: 29, 43, 45, 77, 95, 99, 101, 105,
     * 113, 135, 141, 169, 195, 207, 231, and 245.
     */

    static GENERATING_POLYNOMIAL = 29;

    /**
     * Mapping from members of the Galois Field to their
     * vareger logarithms.  The entry for 0 is meaningless
     * because there is no log of 0.
     *
     * This array is shorts, not bytes, so that they can
     * be used directly to index arrays without casting.
     * The values (except the non-value at index 0) are
     * all really bytes, so they range from 0 to 255.
     *
     * This table was generated by java_tables.py, and the
     * unit tests check it against the Java implementation.
     */

    static LOG_TABLE = [
        -1,    0,    1,   25,    2,   50,   26,  198,
        3,  223,   51,  238,   27,  104,  199,   75,
        4,  100,  224,   14,   52,  141,  239,  129,
        28,  193,  105,  248,  200,    8,   76,  113,
        5,  138,  101,   47,  225,   36,   15,   33,
        53,  147,  142,  218,  240,   18,  130,   69,
        29,  181,  194,  125,  106,   39,  249,  185,
        201,  154,    9,  120,   77,  228,  114,  166,
        6,  191,  139,   98,  102,  221,   48,  253,
        226,  152,   37,  179,   16,  145,   34,  136,
        54,  208,  148,  206,  143,  150,  219,  189,
        241,  210,   19,   92,  131,   56,   70,   64,
        30,   66,  182,  163,  195,   72,  126,  110,
        107,   58,   40,   84,  250,  133,  186,   61,
        202,   94,  155,  159,   10,   21,  121,   43,
        78,  212,  229,  172,  115,  243,  167,   87,
        7,  112,  192,  247,  140,  128,   99,   13,
        103,   74,  222,  237,   49,  197,  254,   24,
        227,  165,  153,  119,   38,  184,  180,  124,
        17,   68,  146,  217,   35,   32,  137,   46,
        55,   63,  209,   91,  149,  188,  207,  205,
        144,  135,  151,  178,  220,  252,  190,   97,
        242,   86,  211,  171,   20,   42,   93,  158,
        132,   60,   57,   83,   71,  109,   65,  162,
        31,   45,   67,  216,  183,  123,  164,  118,
        196,   23,   73,  236,  127,   12,  111,  246,
        108,  161,   59,   82,   41,  157,   85,  170,
        251,   96,  134,  177,  187,  204,   62,   90,
        203,   89,   95,  176,  156,  169,  160,   81,
        11,  245,   22,  235,  122,  117,   44,  215,
        79,  174,  213,  233,  230,  231,  173,  232,
        116,  214,  244,  234,  168,   80,   88,  175
    ];  
    
    /**
     * Inverse of the logarithm table.  Maps vareger logarithms
     * to members of the field.  There is no entry for 255
     * because the highest log is 254.
     *
     * This table was generated by java_tables.py
     */

    static EXP_TABLE = [
        1,    2,    4,    8,   16,   32,   64, -128,
        29,   58,  116,  -24,  -51, -121,   19,   38,
        76, -104,   45,   90,  -76,  117,  -22,  -55,
        -113,    3,    6,   12,   24,   48,   96,  -64,
        -99,   39,   78, -100,   37,   74, -108,   53,
        106,  -44,  -75,  119,  -18,  -63,  -97,   35,
        70, -116,    5,   10,   20,   40,   80,  -96,
        93,  -70,  105,  -46,  -71,  111,  -34,  -95,
        95,  -66,   97,  -62, -103,   47,   94,  -68,
        101,  -54, -119,   15,   30,   60,  120,  -16,
        -3,  -25,  -45,  -69,  107,  -42,  -79,  127,
        -2,  -31,  -33,  -93,   91,  -74,  113,  -30,
        -39,  -81,   67, -122,   17,   34,   68, -120,
        13,   26,   52,  104,  -48,  -67,  103,  -50,
        -127,   31,   62,  124,   -8,  -19,  -57, -109,
        59,  118,  -20,  -59, -105,   51,  102,  -52,
        -123,   23,   46,   92,  -72,  109,  -38,  -87,
        79,  -98,   33,   66, -124,   21,   42,   84,
        -88,   77, -102,   41,   82,  -92,   85,  -86,
        73, -110,   57,  114,  -28,  -43,  -73,  115,
        -26,  -47,  -65,   99,  -58, -111,   63,  126,
        -4,  -27,  -41,  -77,  123,  -10,  -15,   -1,
        -29,  -37,  -85,   75, -106,   49,   98,  -60,
        -107,   55,  110,  -36,  -91,   87,  -82,   65,
        -126,   25,   50,  100,  -56, -115,    7,   14,
        28,   56,  112,  -32,  -35,  -89,   83,  -90,
        81,  -94,   89,  -78,  121,  -14,   -7,  -17,
        -61, -101,   43,   86,  -84,   69, -118,    9,
        18,   36,   72, -112,   61,  122,  -12,  -11,
        -9,  -13,   -5,  -21,  -53, -117,   11,   22,
        44,   88,  -80,  125,   -6,  -23,  -49, -125,
        27,   54,  108,  -40,  -83,   71, -114,
        // Repeat the table a second time, so multiply()
        // does not have to check bounds.
        1,    2,    4,    8,   16,   32,   64, -128,
        29,   58,  116,  -24,  -51, -121,   19,   38,
        76, -104,   45,   90,  -76,  117,  -22,  -55,
        -113,    3,    6,   12,   24,   48,   96,  -64,
        -99,   39,   78, -100,   37,   74, -108,   53,
        106,  -44,  -75,  119,  -18,  -63,  -97,   35,
        70, -116,    5,   10,   20,   40,   80,  -96,
        93,  -70,  105,  -46,  -71,  111,  -34,  -95,
        95,  -66,   97,  -62, -103,   47,   94,  -68,
        101,  -54, -119,   15,   30,   60,  120,  -16,
        -3,  -25,  -45,  -69,  107,  -42,  -79,  127,
        -2,  -31,  -33,  -93,   91,  -74,  113,  -30,
        -39,  -81,   67, -122,   17,   34,   68, -120,
        13,   26,   52,  104,  -48,  -67,  103,  -50,
        -127,   31,   62,  124,   -8,  -19,  -57, -109,
        59,  118,  -20,  -59, -105,   51,  102,  -52,
        -123,   23,   46,   92,  -72,  109,  -38,  -87,
        79,  -98,   33,   66, -124,   21,   42,   84,
        -88,   77, -102,   41,   82,  -92,   85,  -86,
        73, -110,   57,  114,  -28,  -43,  -73,  115,
        -26,  -47,  -65,   99,  -58, -111,   63,  126,
        -4,  -27,  -41,  -77,  123,  -10,  -15,   -1,
        -29,  -37,  -85,   75, -106,   49,   98,  -60,
        -107,   55,  110,  -36,  -91,   87,  -82,   65,
        -126,   25,   50,  100,  -56, -115,    7,   14,
        28,   56,  112,  -32,  -35,  -89,   83,  -90,
        81,  -94,   89,  -78,  121,  -14,   -7,  -17,
        -61, -101,   43,   86,  -84,   69, -118,    9,
        18,   36,   72, -112,   61,  122,  -12,  -11,
        -9,  -13,   -5,  -21,  -53, -117,   11,   22,
        44,   88,  -80,  125,   -6,  -23,  -49, -125,
        27,   54,  108,  -40,  -83,   71, -114
    ];   
    
    
    /**
     * Adds two elements of the field.  If you're in an inner loop,
     * you should inline this function: it's just XOR.
     */
    static add(a, b) {
        return (a ^ b);
    }

    /**
     * Inverse of addition.  If you're in an inner loop,
     * you should inline this function: it's just XOR.
     */
    static subtract(a, b) {
        return (a ^ b);
    }

    /**
     * Multiplies to elements of the field.
     */
    static multiply(a, b) {
        if (a == 0 || b == 0) {
            return 0;
        }
        else {
            let logA = Galois.LOG_TABLE[a & 0xFF];
            let logB = Galois.LOG_TABLE[b & 0xFF];
            let logResult = logA + logB;
            return Galois.EXP_TABLE[logResult];
        }
    }

    /**
     * Inverse of multiplication.
     */
    static divide(a, b) {
        if (a == 0) {
            return 0;
        }
        if (b == 0) {
            throw new Error("Argument 'divisor' is 0");
        }
        let logA = Galois.LOG_TABLE[a & 0xFF];
        let logB = Galois.LOG_TABLE[b & 0xFF];
        let logResult = logA - logB;
        if (logResult < 0) {
            logResult += 255;
        }
        return Galois.EXP_TABLE[logResult];
    }

    /**
     * Computes a**n.
     *
     * The result will be the same as multiplying a times itself n times.
     *
     * A member of the field.
     * A plain-old vareger.
     * The result of multiplying a by itself n times.
     */
    static exp(a, n) {
        if (n == 0) {
            return 1;
        }
        else if (a == 0) {
            return 0;
        }
        else {
            let logA = Galois.LOG_TABLE[a & 0xFF];
            let logResult = logA * n;
            while (255 <= logResult) {
                logResult -= 255;
            }
            return Galois.EXP_TABLE[logResult];
        }
    }

    /**
     * Generates a logarithm table given a starting polynomial.
     */
    static generateLogTable(polynomial) {
        let result = new Int16Array(Galois.FIELD_SIZE);
        
        for (let i = 0; i < Galois.FIELD_SIZE; i++) {
            result[i] = -1; // -1 means "not set"
        }
        let b = 1;
        for (let log = 0; log < Galois.FIELD_SIZE - 1; log++) {
            if (result[b] != -1) {
                throw new Error("BUG: duplicate logarithm (bad polynomial?)");
            }
            result[b] = log;
            b = (b << 1);
            if (Galois.FIELD_SIZE <= b) {
                b = ((b - Galois.FIELD_SIZE) ^ polynomial);
            }
        }
        return result;
    }

    /**
     * Generates the inverse log table.
     */
    static generateExpTable(logTable) {
        let result = new Uint8Array(Galois.FIELD_SIZE * 2 - 2);
        for (let i = 1; i < Galois.FIELD_SIZE; i++) {
            let log = logTable[i];
            result[log] = i;
            result[log + Galois.FIELD_SIZE - 1] = i;
        }
        return result;
    }

    /**
     * Returns a list of all polynomials that can be used to generate
     * the field.
     *
     * This is never used in the code; it's just here for completeness.
     */
    static allPossiblePolynomials() {
        let result = new Int32Array([]);
        for (let i = 0; i < Galois.FIELD_SIZE; i++) {
            try {
                this.generateLogTable(i);
                result.push(i);
            }
            catch (e) {
                // this one didn't work
                throw new Error("allPossiblePolynomials didn't work");
            }
        }
        return result;
    }    
}

/////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Matrix Algebra over an 8-bit Galois Field
 *
 * Copyright 2015, Backblaze, Inc.
 */

/**
 * A matrix over the 8-bit Galois field.
 *
 * This class is not performance-critical, so the implementations
 * are simple and straightforward.
 */
class Matrix {

    /**
     * The number of rows in the matrix.
     */
    rows;

    /**
     * The number of columns in the matrix.
     */
    columns;

    /**
     * The data in the matrix, in row major form.
     *
     * To get element (r, c): data[r][c]
     *
     * Because this this is computer science, and not math,
     * the indices for both the row and column start at 0.
     */
    data;    


    /**
     * Initialize a matrix of zeros.
     *
     * initRows The number of rows in the matrix.
     * initColumns The number of columns in the matrix.
     */    
    constructor(initRows, initColumns) {
        this.rows = initRows;
        this.columns = initColumns;
        this.data = [];
        for (let r = 0; r < this.rows; r++) {
            this.data[r] = new Uint8Array(this.columns);
        }
    }

    /**
     * Returns an identity matrix of the given size.
     */
    static identity(size) {
        let result = new Matrix(size, size);
        for (let i = 0; i < size; i++) {
            result.set(i, i, 1);
        }
        return result;
    }    
    
    
    /**
     * Returns the number of columns in this matrix.
     */    
    getColumns() {
        return this.columns;
    }

    /**
     * Returns the number of rows in this matrix.
     */
    getRows() {
        return this.rows;
    }

    /**
     * Returns the value at row r, column c.
     */
    get(r, c) {
        if (r < 0 || this.rows <= r) {
            throw new Error("Row index out of range: " + r);
        }
        if (c < 0 || this.columns <= c) {
            throw new Error("Column index out of range: " + c);
        }
        return this.data[r][c];
    }

    /**
     * Sets the value at row r, column c.
     */
    set(r, c, value) {
        if (r < 0 || this.rows <= r) {
            throw new Error("Row index out of range: " + r);
        }
        if (c < 0 || this.columns <= c) {
            throw new Error("Column index out of range: " + c);
        }
        this.data[r][c] = value;
    } 
    
   /**
     * Multiplies this matrix (the one on the left) by another
     * matrix (the one on the right).
     */
    times(right) {
        if (this.getColumns() != right.getRows()) {
            throw new Error(
                    "Columns on left (" + this.getColumns() +") " +
                    "is different than rows on right (" + right.getRows() + ")");
        }
        let result = new Matrix(this.getRows(), right.getColumns());
        for (let r = 0; r < this.getRows(); r++) {
            for (let c = 0; c < right.getColumns(); c++) {
                let value = 0;
                for (let i = 0; i < this.getColumns(); i++) {
                    value ^= Galois.multiply(this.get(r, i), right.get(i, c));
                }
                result.set(r, c, value);
            }
        }
        return result;
    }    

    /**
     * Returns the concatenation of this matrix and the matrix on the right.
     */
    augment(right) {
        if (this.rows != right.rows) {
            throw new Error("Matrices don't have the same number of rows");
        }
        let result = new Matrix(this.rows, this.columns + right.columns);
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                result.data[r][c] = this.data[r][c];
            }
            for (let c = 0; c < right.columns; c++) {
                result.data[r][this.columns + c] = right.data[r][c];
            }
        }
        return result;
    } 
    

    /**
     * Returns a part of this matrix.
     */
    submatrix(rmin, cmin, rmax, cmax) {
        let result = new Matrix(rmax - rmin, cmax - cmin);
        for (let r = rmin; r < rmax; r++) {
            for (let c = cmin; c < cmax; c++) {
                result.data[r - rmin][c - cmin] = this.data[r][c];
            }
        }
        return result;
    }


    /**
     * Returns one row of the matrix as a byte array.
     */
    getRow(row) {
        let result = new Uint8Array(this.columns);
        for (let c = 0; c < this.columns; c++) {
            result[c] = this.get(row, c);
        }
        return result;
    }

    /**
     * Exchanges two rows in the matrix.
     */
    swapRows(r1, r2) {
        if (r1 < 0 || this.rows <= r1 || r2 < 0 || this.rows <= r2) {
            throw new Error("Row index out of range");
        }

        let tmp = this.data[r1];
        this.data[r1] = this.data[r2];
        this.data[r2] = tmp;
    }


    /**
     * Returns the inverse of this matrix.
     *
     * throws Exception when the matrix is singular and
     * doesn't have an inverse.
     */
    invert() {
        // Sanity check.
        if (this.rows != this.columns) {
            throw new Error("Only square matrices can be inverted");
        }

        // Create a working matrix by augmenting this one with
        // an identity matrix on the right.
        let work = this.augment(Matrix.identity(this.rows));

        // Do Gaussian elimination to transform the left half varo
        // an identity matrix.
        work.gaussianElimination();

        // The right half is now the inverse.
        return work.submatrix(0, this.rows, this.columns, this.columns * 2);
    }
    
    /**
     * Does the work of matrix inversion.
     *
     * Assumes that this is an r by 2r matrix.
     */
    gaussianElimination() {

        // Clear out the part below the main diagonal and scale the main
        // diagonal to be 1.
        for (let r = 0; r < this.rows; r++) {
            // If the element on the diagonal is 0, find a row below
            // that has a non-zero and swap them.
            if (this.data[r][r] == 0) {
                for (let rowBelow = r + 1; rowBelow < this.rows; rowBelow++) {
                    if (this.data[rowBelow][r] != 0) {
                        this.swapRows(r, rowBelow);
                        break;
                    }
                }
            }
            // If we couldn't find one, the matrix is singular.
            if (this.data[r][r] == 0) {
                throw new Error("Matrix is singular");
            }
            // Scale to 1.
            if (this.data[r][r] != 1) {
                let scale = Galois.divide(1, this.data[r][r]);
                for (let c = 0; c < this.columns; c++) {
                    this.data[r][c] = Galois.multiply(this.data[r][c], scale);
                }
            }
            // Make everything below the 1 be a 0 by subtracting
            // a multiple of it.  (Subtraction and addition are
            // both exclusive or in the Galois field.)
            for (let rowBelow = r + 1; rowBelow < this.rows; rowBelow++) {
                if (this.data[rowBelow][r] != 0) {
                    let scale = this.data[rowBelow][r];
                    for (let c = 0; c < this.columns; c++) {
                        this.data[rowBelow][c] ^= Galois.multiply(scale, this.data[r][c]);
                    }
                }
            }
        }

        // Now clear the part above the main diagonal.
        for (let d = 0; d < this.rows; d++) {
            for (let rowAbove = 0; rowAbove < d; rowAbove++) {
                if (this.data[rowAbove][d] != 0) {
                    let scale = this.data[rowAbove][d];
                    for (let c = 0; c < this.columns; c++) {
                        this.data[rowAbove][c] ^= Galois.multiply(scale, this.data[d][c]);
                    }

                }
            }
        }
    }


}

/////////////////////////////////////////////////////////////////////////////////////////////////////


/**
 * Reed-Solomon Coding over 8-bit values.
 *
 * Copyright 2015, Backblaze, Inc.
 */


/**
 * Reed-Solomon Coding over 8-bit values.
 */
export class ReedSolomon {

    dataShardCount;
    parityShardCount;
    totalShardCount;
    matrix;

    /**
     * Rows from the matrix for encoding parity, each one as its own
     * byte array to allow for efficient access while encoding.
     */
    parityRows;

    /**
     * Initializes a new encoder/decoder.
     */
    constructor(dataShardCount, parityShardCount) {
        this.dataShardCount = dataShardCount;
        this.parityShardCount = parityShardCount;
        this.totalShardCount = this.dataShardCount + this.parityShardCount;
        this.matrix = this.buildMatrix(this.dataShardCount, this.totalShardCount);
        this.parityRows = [];
        for (let i = 0; i < this.parityShardCount; i++) {
            this.parityRows[i] = this.matrix.getRow(this.dataShardCount + i);
        }
    }

    /**
     * Returns the number of data shards.
     */
    getDataShardCount() {
        return this.dataShardCount;
    }

    /**
     * Returns the number of parity shards.
     */
    getParityShardCount() {
        return this.parityShardCount;
    }

    /**
     * Returns the total number of shards.
     */
    getTotalShardCount() {
        return this.totalShardCount;
    }

    /**
     * Encodes parity for a set of data shards.
     *
     * shards An array containing data shards followed by parity shards.
     *               Each shard is a byte array, and they must all be the same
     *               size.
     * offset The index of the first byte in each shard to encode.
     * byteCount The number of bytes to encode in each shard.
     *
     */
    encodeParity(shards, offset, byteCount) {
        // Check arguments.
        this.checkBuffersAndSizes(shards, offset, byteCount);

        // Build the array of output buffers.
        let outputs = [];
        for (let i = 0; i < this.parityShardCount; i++) {
            outputs[i] = shards[this.dataShardCount + i];
        }

        // Do the coding.
        this.codeSomeShards(this.parityRows, shards, outputs, this.parityShardCount,
                offset, byteCount);
    }

    /**
     * Returns true if the parity shards contain the right data.
     *
     * shards An array containing data shards followed by parity shards.
     *               Each shard is a byte array, and they must all be the same
     *               size.
     * firstByte The index of the first byte in each shard to check.
     * byteCount The number of bytes to check in each shard.
     */
    isParityCorrect(shards, firstByte, byteCount) {
        // Check arguments.
        this.checkBuffersAndSizes(shards, firstByte, byteCount);

        // Build the array of buffers being checked.
        let toCheck = [];
        for (let i = 0; i < this.parityShardCount; i++) {
            toCheck[i] = shards[this.dataShardCount + i];
        }

        // Do the checking.
        return this.checkSomeShards(this.parityRows, shards, toCheck, this.parityShardCount,
                firstByte, byteCount);
    }


    /**
     * Given a list of shards, some of which contain data, fills in the
     * ones that don't have data.
     *
     * Quickly does nothing if all of the shards are present.
     *
     * If any shards are missing (based on the flags in shardsPresent),
     * the data in those shards is recomputed and filled in.
     */
    decodeMissing(shards,
                 shardPresent,
                 offset,
                 byteCount) {
        // Check arguments.
        this.checkBuffersAndSizes(shards, offset, byteCount);

        // Quick check: are all of the shards present?  If so, there's
        // nothing to do.
        let numberPresent = 0;
        for (let i = 0; i < this.totalShardCount; i++) {
            if (shardPresent[i]) {
                numberPresent += 1;
            }
        }
        if (numberPresent == this.totalShardCount) {
            // Cool.  All of the shards data data.  We don't
            // need to do anything.
            return;
        }

        // More complete sanity check
        if (numberPresent < this.dataShardCount) {
            throw new Error("Not enough shards present");
        }

        // Pull out the rows of the this.matrix that correspond to the
        // shards that we have and build a square this.matrix.  This
        // this.matrix could be used to generate the shards that we have
        // from the original data.
        //
        // Also, pull out an array holding just the shards that
        // correspond to the rows of the subthis.matrix.  These shards
        // will be the input to the decoding process that re-creates
        // the missing data shards.
        let subMatrix = new Matrix(this.dataShardCount, this.dataShardCount);
        let subShards = new Array(this.dataShardCount);
        {
            let subMatrixRow = 0;
            for (let matrixRow = 0; matrixRow < this.totalShardCount && subMatrixRow < this.dataShardCount; matrixRow++) {
                if (shardPresent[matrixRow]) {
                    for (let c = 0; c < this.dataShardCount; c++) {
                        subMatrix.set(subMatrixRow, c, this.matrix.get(matrixRow, c));
                    }
                    subShards[subMatrixRow] = shards[matrixRow];
                    subMatrixRow += 1;
                }
            }
        }

        // Invert the this.matrix, so we can go from the encoded shards
        // back to the original data.  Then pull out the row that
        // generates the shard that we want to decode.  Note that
        // since this this.matrix maps back to the orginal data, it can
        // be used to create a data shard, but not a parity shard.
        let dataDecodeMatrix = subMatrix.invert();

        // Re-create any data shards that were missing.
        //
        // The input to the coding is all of the shards we actually
        // have, and the output is the missing data shards.  The computation
        // is done using the special decode this.matrix we just built.
        let outputs = [];
        let matrixRows = [];
        let outputCount = 0;
        for (let iShard = 0; iShard < this.dataShardCount; iShard++) {
            if (!shardPresent[iShard]) {
                outputs[outputCount] = shards[iShard];
                matrixRows[outputCount] = dataDecodeMatrix.getRow(iShard);
                outputCount += 1;
            }
        }
        this.codeSomeShards(matrixRows, subShards, outputs, outputCount, offset, byteCount);

        // Now that we have all of the data shards varact, we can
        // compute any of the parity that is missing.
        //
        // The input to the coding is ALL of the data shards, including
        // any that we just calculated.  The output is whichever of the
        // data shards were missing.
        outputCount = 0;
        for (let iShard = this.dataShardCount; iShard < this.totalShardCount; iShard++) {
            if (!shardPresent[iShard]) {
                outputs[outputCount] = shards[iShard];
                matrixRows[outputCount] = this.parityRows[iShard - this.dataShardCount];
                outputCount += 1;
            }
        }
        this.codeSomeShards(matrixRows, shards, outputs, outputCount, offset, byteCount);
    }

    /**
     * Checks the consistency of arguments passed to public methods.
     */
    checkBuffersAndSizes(shards, offset, byteCount) {
        // The number of buffers should be equal to the number of
        // data shards plus the number of parity shards.
        if (shards.length != this.totalShardCount) {
            throw new Error("wrong number of shards: " + shards.length);
        }

        // All of the shard buffers should be the same length.
        let shardLength = shards[0].length;
        for (let i = 1; i < shards.length; i++) {
            if (shards[i].length != shardLength) {
                throw new Error("Shards are different sizes");
            }
        }

        // The offset and byteCount must be non-negative and fit in the buffers.
        if (offset < 0) {
            throw new Error("offset is negative: " + offset);
        }
        if (byteCount < 0) {
            throw new Error("byteCount is negative: " + byteCount);
        }
        if (shardLength < offset + byteCount) {
            throw new Error("buffers to small: " + byteCount + offset);
        }
    }

    /**
     * Multiplies a subset of rows from a coding this.matrix by a full set of
     * input shards to produce some output shards.
     *
     * matrixRows The rows from the this.matrix to use.
     * inputs An array of byte arrays, each of which is one input shard.
     *               The inputs array may have extra buffers after the ones
     *               that are used.  They will be ignored.  The number of
     *               inputs used is determined by the length of the
     *               each this.matrix row.
     * outputs Byte arrays where the computed shards are stored.  The
     *                outputs array may also have extra, unused, elements
     *                at the end.  The number of outputs computed, and the
     *                number of this.matrix rows used, is determined by
     *                outputCount.
     * outputCount The number of outputs to compute.
     * offset The index in the inputs and output of the first byte
     *               to process.
     * byteCount The number of bytes to process.
     */
    codeSomeShards(matrixRows,
                   inputs,
                   outputs,
                   outputCount,
                   offset,
                   byteCount) {

        // This is the inner loop.  It needs to be fast.  Be careful
        // if you change it.
        //
        // Note that this.dataShardCount is final in the class, so the
        // compiler can load it just once, before the loop.  Explicitly
        // adding a local variable does not make it faster.
        //
        // I have tried inlining Galois.multiply(), but it doesn't
        // make things any faster.  The JIT compiler is known to inline
        // methods, so it's probably already doing so.
        //
        // This method has been timed and compared with a C implementation.
        // This Java version is only about 10% slower than C.

        for (let iByte = offset; iByte < offset + byteCount; iByte++) {
            for (let iRow = 0; iRow < outputCount; iRow++) {
                let matrixRow = matrixRows[iRow];
                let value = 0;
                for (let c = 0; c < this.dataShardCount; c++) {
                    value ^= Galois.multiply(matrixRow[c], inputs[c][iByte]);
                }
                outputs[iRow][iByte] = value;
            }
        }
    }

    /**
     * Multiplies a subset of rows from a coding this.matrix by a full set of
     * input shards to produce some output shards, and checks that the
     * the data is those shards matches what's expected.
     *
     * matrixRows The rows from the this.matrix to use.
     * inputs An array of byte arrays, each of which is one input shard.
     *               The inputs array may have extra buffers after the ones
     *               that are used.  They will be ignored.  The number of
     *               inputs used is determined by the length of the
     *               each this.matrix row.
     * toCheck Byte arrays where the computed shards are stored.  The
     *                outputs array may also have extra, unused, elements
     *                at the end.  The number of outputs computed, and the
     *                number of this.matrix rows used, is determined by
     *                outputCount.
     * checkCount The number of outputs to compute.
     * offset The index in the inputs and output of the first byte
     *               to process.
     * byteCount The number of bytes to process.
     */
    checkSomeShards(matrixRows,
                                    inputs,
                                    toCheck,
                                    checkCount,
                                    offset,
                                    byteCount) {

        // This is the inner loop.  It needs to be fast.  Be careful
        // if you change it.
        //
        // Note that this.dataShardCount is final in the class, so the
        // compiler can load it just once, before the loop.  Explicitly
        // adding a local variable does not make it faster.
        //
        // I have tried inlining Galois.multiply(), but it doesn't
        // make things any faster.  The JIT compiler is known to inline
        // methods, so it's probably already doing so.
        //
        // This method has been timed and compared with a C implementation.
        // This Java version is only about 10% slower than C.

        for (let iByte = offset; iByte < offset + byteCount; iByte++) {
            for (let iRow = 0; iRow < checkCount; iRow++) {
                let matrixRow = matrixRows[iRow];
                let value = 0;
                for (let c = 0; c < this.dataShardCount; c++) {
                    value ^= Galois.multiply(matrixRow[c], inputs[c][iByte]);
                }
                if (toCheck[iRow][iByte] != value) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Create the this.matrix to use for encoding, given the number of
     * data shards and the number of total shards.
     *
     * The top square of the this.matrix is guaranteed to be an identity
     * this.matrix, which means that the data shards are unchanged after
     * encoding.
     */
    buildMatrix(dataShards, totalShards) {
        // Start with a Vandermonde this.matrix.  This this.matrix would work,
        // in theory, but doesn't have the property that the data
        // shards are unchanged after encoding.
        let vandermonde = this.vandermonde(totalShards, dataShards);

        // Multiple by the inverse of the top square of the this.matrix.
        // This will make the top square be the identity this.matrix, but
        // preserve the property that any square subset of rows  is
        // invertible.
        let top = vandermonde.submatrix(0, 0, dataShards, dataShards);
        return vandermonde.times(top.invert());
    }

    /**
     * Create a Vandermonde this.matrix, which is guaranteed to have the
     * property that any subset of rows that forms a square this.matrix
     * is invertible.
     *
     * rows Number of rows in the result.
     * cols Number of columns in the result.
     * A Matrix.
     */
    vandermonde(rows, cols) {
        let result = new Matrix(rows, cols);
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                result.set(r, c, Galois.exp(r, c));
            }
        }
        return result;
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Class for facilitating the rebuilding of the received shards
export class ReceivedShards {
    
    shards = null;
    shardPresent = null;  
    
    data = null;
    
    numReceivedShards = 0;
    
    shardLength = 0;
    numTotalShards = 0;
    numDataShards = 0;
    numParityShards = 0; 
    
    dataReconstructed = false;

    timestamp;
    
    constructor() {
        this.shards = null;
        this.timestamp = Date.now();
    }

    getTimestamp() {
        return this.timestamp;
    }
     
    areDataReconstructed() {
        return this.dataReconstructed;
    }
    
    getData() {
        return this.data;
    }
    
    getSize() {
        return this.data.length;
    }    
    
    getTotalShards() {
        return this.numTotalShards;
    }
    
    getNumDataShards() {
        return this.numDataShards;
    }
    
    getParityShards() {
        return this.numParityShards;
    }
    
    getShardLenght() {
        return this.shardLength;
    }
    
    setShard(shardNo, shard, shardLengthIn, numTotalShardsIn, numDataShardsIn, numParityShardsIn) {
        
        if ((this.shards == null) || (this.shardLength != shardLengthIn) || (this.numTotalShards != numTotalShardsIn)) {

            this.numReceivedShards = 0;
            
            this.shards = [];
            this.shardPresent = [];
            for (let i = 0; i < numTotalShardsIn; i++) {
                this.shardPresent[i] = false;
            }
            
            this.shardLength = shardLengthIn;
            this.numTotalShards = numTotalShardsIn;
            this.numDataShards = numDataShardsIn;
            this.numParityShards = numParityShardsIn;  
            
            this.dataReconstructed = false;
        }
       
        if (!this.shardPresent[shardNo]) {

            if (shard.length == this.shards[shardNo].length) {
               
                this.shards[shardNo] = new Uint8Array(shardLengthIn);

                for (let i = 0; i < shard.length; i++) {
                    this.shards[shardNo][i] = shard[i];
                }

                this.shardPresent[shardNo] = true;
                this.numReceivedShards++;
            }
        }
        
    }
    
    getNumReceivedShards() {
        return this.numReceivedShards;
    }
    
    areEnoughShardsReceived() {
        return this.numDataShards <= this.numReceivedShards;
    }
    
    reconstructDataWithReedSolomon() {
        
        if (this.areEnoughShardsReceived()) {

            // Reeed-Solomom.
            let reedSolomon = 
                    new ReedSolomon(this.shardPresent.length - this.numParityShards, 
                            this.numParityShards);

            reedSolomon.decodeMissing(this.shards, this.shardPresent, 0,  this.shardLength);

            // Write the Reed-Solomon matrix of shards to a 1D array of bytes
            this.data = new Uint8Array(this.shardLength * this.numDataShards);

            let offset = 0;
            for (let j = 0; j < this.shards.length - this.numParityShards; j++) {
                for (let i = 0; i < this.shardLength; i++) {
                    this.data[offset + i] = this.shards[j][i];
                }
                offset += this.shardLength;
            }
            
            this.dataReconstructed = true;
            
            return true;
        }  
        return false;
    }
}

  // Helper functions

  // Calculate padding for data
  export function calculateDataPadding(dataSize, numShards)
  {
      if (dataSize < numShards)
      {
          return numShards;
      }
      let rem = dataSize % numShards;
      if (rem != 0)
      {
          let newSize = numShards * Math.trunc((dataSize / numShards) + 0.9);
          if (newSize < dataSize)
          {
              newSize += numShards;
          }
          return dataSize + (newSize - dataSize);
      }
      else
      {
          return dataSize;
      }
  }

  // calculate number of shards
  export function calculateNShards(dataSize, nServers)
  {

      let nShards = (1 + Math.trunc(dataSize / 256)) * nServers;

      if (nShards > 255)
      {
          nShards = 255;
      }

      return nShards;
  }

  // calculate Reed-Solomon shards a 2D array named dataShards
  export function calculateReedSolomonShards(
      dataBytes,
      totalNShards,
      parityNShards,
      dataNShards)
  {

    let paddedDataSize = calculateDataPadding(dataBytes.length + 1, dataNShards);

    let dataShardLength = Math.trunc(paddedDataSize / dataNShards);

    let dataShards = [];
    for (let i = 0; i < totalNShards; i++)
    {
        dataShards[i] = new Uint8Array(dataShardLength);
    }

    let paddedDataBytes = [];
    for (let i = 0; i < dataBytes.length; i++) {
        paddedDataBytes[i] = dataBytes[i];
    }
    paddedDataBytes[dataBytes.length] = 1;

    let shardNo = 0;
    let metadataOffset = 0;

    for (let i = 1; i <= dataNShards; i++)
    {
        for (let j = 0; j < dataShardLength; j++) {
            dataShards[shardNo][j] =  paddedDataBytes[metadataOffset + j];
        }

        metadataOffset += dataShardLength;

        shardNo++;
    }

    let reedSolomon = new ReedSolomon(dataNShards, parityNShards);

    reedSolomon.encodeParity(dataShards, 0, dataShardLength);

    return dataShards;
  }

  export function StripPadding(paddedData)
  {  
      let padding = 1;
      for (let i = paddedData.length - 1; i >= 0; i--)
      {
          if (paddedData[i] === 0)
          {
              padding++;
          }
          else
          {
              break;
          }
      }

      let strippedData = new Uint8Array(paddedData.length - padding); 
     
      for (let i = 0; i < strippedData.length; i++) {
        strippedData[i] = paddedData[i];
      }

      return strippedData;    
  }





  

