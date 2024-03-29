import axios from 'axios';
import cbor from 'cbor-js';
import { encryptDataAndSendtoServer } from '../protocol';

jest.mock('axios');
jest.mock('cbor-js');

describe('protocol', () => {
  describe('encryptDataAndSendtoServer', () => {
    beforeEach(() => {
      // Reset mocks before each test
      axios.post.mockClear();
      cbor.encode.mockClear();
      cbor.decode.mockClear();
    });

    it('should encode data, send it to the server, and decode the response', async () => {
      // Setup
      const mockEncodedData = new Uint8Array([1, 2, 3]);
      const mockDecodedResponse = { result: 'success' };
      const mockResponseData = 'mocked_response_data';

      cbor.encode.mockReturnValue(mockEncodedData);
      cbor.decode.mockReturnValue(mockDecodedResponse);
      axios.post.mockResolvedValue({ data: mockResponseData });

      const ENCRYPTS = 'mocked_encrypts';
      const SIGNS = 'mocked_signs';
      const SRC = 'mocked_src';
      const endpoint = 'https://example.com/api/endpoint';
      const numServers = 3;
      const transactionData = { id: '123', name: 'Test' };

      // Execute
      const response = await encryptDataAndSendtoServer(ENCRYPTS, SIGNS, SRC, endpoint, numServers, transactionData);

      // Assert
      expect(cbor.encode).toHaveBeenCalledWith(expect.anything()); // You might wan t to be more specific based on your implementation
      expect(axios.post).toHaveBeenCalledWith(endpoint, expect.any(Uint8Array), expect.any(Object));
      expect(cbor.decode).toHaveBeenCalledWith(expect.anything()); // Similarly, be specific about the argument if possible
      expect(response).toEqual(mockDecodedResponse);
    });

    // Additional tests can be written to cover error handling, different paths through the function, etc.
  });
});