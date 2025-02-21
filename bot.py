import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import WebAppInfo
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties

# Включаем логирование
logging.basicConfig(level=logging.INFO)

bot = Bot(
    token='7091590459:AAFuMkVB-DHeazhmtXGNOsKpydKKBYNNmfg',
    default=DefaultBotProperties(parse_mode=ParseMode.HTML)
)
dp = Dispatcher()

async def start(message: types.Message):
    markup = types.ReplyKeyboardMarkup(
        keyboard=[  # ✅ Передаём список кнопок
            [types.KeyboardButton(
                text='Открыть веб-страницу',
                web_app=WebAppInfo(url='https://startling-crisp-ddebbb.netlify.app/')  # Укажите рабочий URL
            )]
        ],
        resize_keyboard=True
    )
    await message.answer('Теперь ты можешь открыть страницу сайта', reply_markup=markup)

dp.message.register(start, Command("start"))

async def main():
    logging.info("Бот запущен...")  # Добавляем логирование
    await dp.start_polling(bot)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("Бот остановлен вручную")
