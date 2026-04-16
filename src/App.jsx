// App.jsx
import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [isCanceled, setIsCanceled] = useState(false);

  // Функция polling
  const pollResult = async (task_id, interval = 1000, maxAttempts = 1000) => {
    let attempts = 0;
    while (attempts < maxAttempts) {
      if (isCanceled) {
        throw new Error('Отменено пользователем');
      }
      try {
        const response = await axios.get(`http://45.90.217.192:8000/analyze-result/${task_id}`);
        const data = response.data;

        if (data.status === 'canceled') {
          throw new Error('Анализ отменен');
        }

        if (!data.status || data.status === 'done') {
          // Результат готов
          return data;
        }

        // if (data.status === 'processing') {
          // Ждем и пробуем снова
          await new Promise(resolve => setTimeout(resolve, interval));
        // }

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
      // 1️⃣ Отправляем POST-запрос на анализ
      const task_response = await axios.post(
        'http://45.90.217.192:8000/analyze',
        formData
      );

      const data = task_response.data;
      
      // 🔍 Проверяем, пришел ли результат сразу (из кэша)
      if (data.id && data.diagnosis) {
        // Это результат из кэша - показываем сразу
        console.log('Получен результат из кэша:', data);
        setResult(data);
      } 
      // Если пришел task_id - значит задача в обработке
      else if (data.task_id) {
        console.log('Задача создана, task_id:', data.task_id);
        setTaskId(data.task_id);
        // 2️⃣ Опрашиваем сервер до готовности результата
        const analysisResult = await pollResult(data.task_id);
        setResult(analysisResult);
      } 
      else {
        throw new Error('Неожиданный формат ответа от сервера');
      }

    } catch (err) {
      console.error('Ошибка при анализе:', err);
      setError(err.message || 'Что-то пошло не так');

    } finally {
      setLoading(false);
    }
};

  const handleCancel = async () => {
  if (!taskId) return;

  try {
    await axios.post(
      `http://45.90.217.192:8000/cancel/${taskId}`
    );
  } catch (e) {
    console.error(e);
  }

  setIsCanceled(true);
  setLoading(false);
  setResult(null);
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

      {loading && (
        <button type="button" onClick={handleCancel}>
          ❌
        </button>
)}
      </form>

      {error && <p className="error">{error}</p>}

      {result && !result.error && (
        <div className="result">
          <h2>Результат анализа:</h2>
          {/* <p><strong>Диагноз:</strong> {result.diagnosis}</p>
          <p><strong>Вероятность:</strong> {(result.confidence * 100).toFixed(1)}%</p>
          <p><strong>Рекомендации:</strong> {result.recommendations}</p> */}

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
