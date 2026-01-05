// App.jsx
import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post('http://45.90.217.192:8000/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
    } catch (error) {
      console.error('Ошибка:', error);
      setResult({ error: 'Что-то пошло не так' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>🐟 Fish-Guard</h1>
      
      <form onSubmit={handleUpload} className="upload-form">
        <input 
          type="file" 
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])} 
        />
        <button type="submit" disabled={!file || loading}>
          {loading ? 'Анализируем...' : 'Диагностировать'}
        </button>
      </form>

      {result && (
        <div className="result">
          {result.error ? (
            <p className="error">{result.error}</p>
          ) : (
            <>
              <h2>Результат анализа:</h2>
              <p><strong>Диагноз:</strong> {result.diagnosis}</p>
              <p><strong>Вероятность:</strong> {(result.confidence * 100).toFixed(1)}%</p>
              <p><strong>Рекомендации:</strong> {result.recommendations}</p>
              
              {/* Отображаем оригинальную картинку */}
              {result.original_image && (
                <div className="image-section">
                  <h3>Ваше изображение:</h3>
                  <img 
                    src={`data:image/${result.image_format || 'jpeg'};base64,${result.original_image}`}
                    alt="Загруженное изображение"
                    className="preview-image"
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;