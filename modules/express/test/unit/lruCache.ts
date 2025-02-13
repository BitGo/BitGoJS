import * as should from 'should';
import LRUCache from '../../src/LRUCache';

describe('LRUCache', function () {
  let cache: LRUCache<string, string>;

  beforeEach(() => {
    cache = new LRUCache<string, string>({
      maxSize: 3,
      ttl: 5000,
    });
  });

  it('should store and retrieve values correctly', () => {
    cache.set('a', 'apple');
    cache.set('b', 'banana');

    'apple'.should.equal(cache.get('a'));
    'banana'.should.equal(cache.get('b'));
  });

  it('should return undefined for non-existing keys', () => {
    should.equal(cache.get('does-not-exist'), undefined);
  });

  it('should evict the least recently used item when the cache exceeds the max size', () => {
    cache.set('a', 'apple');
    cache.set('b', 'banana');
    cache.set('c', 'cherry');
    cache.set('d', 'date');

    should.equal(cache.get('a'), undefined);
    'banana'.should.equal(cache.get('b'));
    'cherry'.should.equal(cache.get('c'));
    'date'.should.equal(cache.get('d'));
  });
});
