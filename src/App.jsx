// App.jsx
import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Функция polling
  const pollResult = async (task_id, interval = 1000, maxAttempts = 1000) => {
    let attempts = 0;
    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(`http://45.90.217.192:8000/analyze-result/${task_id}`);
        const data = response.data;

        if (!data.status || data.status === 'done') {
          // Результат готов
          return data;
        }

        if (data.status === 'processing') {
          // Ждем и пробуем снова
          await new Promise(resolve => setTimeout(resolve, interval));
        }

      } catch (err) {
        console.error('Ошибка при получении результата:', err);
      }

      attempts++;
    }

    throw new Error('Превышено время ожидания результата');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      // 1️⃣ Отправляем POST-запрос на создание задачи
      const task_response = await axios.post(
        'http://45.90.217.192:8000/analyze',
        formData
      );

      const task_id = task_response.data.task_id;
      if (!task_id) throw new Error('Не удалось получить task_id');

      // 2️⃣ Опрашиваем сервер до готовности результата
      const analysisResult = await pollResult(task_id);

      setResult(analysisResult);

    } catch (err) {
      console.error('Ошибка при анализе:', err);
      setError(err.message || 'Что-то пошло не так');

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

      {error && <p className="error">{error}</p>}

      {result && !result.error && (
        <div className="result">
          <h2>Результат анализа:</h2>
          <p><strong>Диагноз:</strong> {result.diagnosis}</p>
          <p><strong>Вероятность:</strong> {(result.confidence * 100).toFixed(1)}%</p>
          <p><strong>Рекомендации:</strong> {result.recommendations}</p>

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
        </div>
      )}

      {result && result.error && <p className="error">{result.error}</p>}
    </div>
  );
}

export default App;
