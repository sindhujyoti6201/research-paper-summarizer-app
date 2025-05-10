import React, { useState, useEffect } from 'react';
import { Folder, Plus, X, ChevronRight } from 'lucide-react';

export default function PaperCollections({ papers }) {
  const [collections, setCollections] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isAddingCollection, setIsAddingCollection] = useState(false);

  // Load collections from localStorage on component mount
  useEffect(() => {
    const savedCollections = localStorage.getItem('paperCollections');
    if (savedCollections) {
      setCollections(JSON.parse(savedCollections));
    }
  }, []);

  // Save collections to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('paperCollections', JSON.stringify(collections));
  }, [collections]);

  const createCollection = () => {
    if (!newCollectionName.trim()) return;
    
    const newCollection = {
      id: Date.now(),
      name: newCollectionName,
      papers: []
    };
    
    setCollections([...collections, newCollection]);
    setNewCollectionName('');
    setIsAddingCollection(false);
  };

  const addPaperToCollection = (collectionId, paper) => {
    setCollections(collections.map(collection => {
      if (collection.id === collectionId) {
        // Check if paper already exists in collection
        if (!collection.papers.some(p => p.s3_key === paper.s3_key)) {
          return {
            ...collection,
            papers: [...collection.papers, paper]
          };
        }
      }
      return collection;
    }));
  };

  const removePaperFromCollection = (collectionId, paperId) => {
    setCollections(collections.map(collection => {
      if (collection.id === collectionId) {
        return {
          ...collection,
          papers: collection.papers.filter(p => p.s3_key !== paperId)
        };
      }
      return collection;
    }));
  };

  const deleteCollection = (collectionId) => {
    setCollections(collections.filter(c => c.id !== collectionId));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Paper Collections</h2>
        <button
          onClick={() => setIsAddingCollection(true)}
          className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
        >
          <Plus size={20} />
          New Collection
        </button>
      </div>

      {isAddingCollection && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Collection name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={createCollection}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Create
            </button>
            <button
              onClick={() => setIsAddingCollection(false)}
              className="px-4 py-2 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {collections.map(collection => (
          <div key={collection.id} className="border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between p-4 bg-gray-50">
              <div className="flex items-center gap-2">
                <Folder className="text-blue-500" size={20} />
                <h3 className="font-medium text-gray-800">{collection.name}</h3>
                <span className="text-sm text-gray-500">
                  ({collection.papers.length} papers)
                </span>
              </div>
              <button
                onClick={() => deleteCollection(collection.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4">
              {collection.papers.length > 0 ? (
                <div className="space-y-2">
                  {collection.papers.map(paper => (
                    <div
                      key={paper.s3_key}
                      className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded"
                    >
                      <span className="text-sm text-gray-600 truncate">
                        {paper.s3_key.split('-').slice(1).join('-')}
                      </span>
                      <button
                        onClick={() => removePaperFromCollection(collection.id, paper.s3_key)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">
                  No papers in this collection
                </p>
              )}
            </div>
          </div>
        ))}

        {collections.length === 0 && !isAddingCollection && (
          <div className="text-center py-8 text-gray-500">
            <Folder className="mx-auto mb-2 text-gray-400" size={32} />
            <p>No collections yet</p>
            <p className="text-sm mt-1">Create a collection to organize your papers</p>
          </div>
        )}
      </div>
    </div>
  );
} 