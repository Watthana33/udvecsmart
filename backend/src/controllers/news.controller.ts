import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { NewsCategory } from '@prisma/client';

/**
 * ดึงรายการข่าวสาร/กิจกรรม/แบนเนอร์ สำหรับหน้าสาธารณะ
 * GET /api/news?category=BANNER_SLIDE&limit=5&page=1
 */
export async function getNewsList(req: Request, res: Response): Promise<void> {
  try {
    const { category, limit = '10', page = '1' } = req.query;

    const take = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const skip = ((Number(page) || 1) - 1) * take;

    const whereCondition: any = {
      isPublished: true, // เฉพาะข่าวที่เผยแพร่แล้ว
    };

    if (category && Object.values(NewsCategory).includes(category as NewsCategory)) {
      whereCondition.category = category as NewsCategory;
    }

    const [total, newsList] = await Promise.all([
      prisma.news.count({ where: whereCondition }),
      prisma.news.findMany({
        where: whereCondition,
        take,
        skip,
        select: {
          id: true,
          title: true,
          content: true,
          coverImageUrl: true,
          category: true,
          viewCount: true,
          createdAt: true,
          author: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      status: 'success',
      pagination: {
        total,
        page: Number(page) || 1,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
      data: newsList,
    });
  } catch (error: any) {
    console.error('getNewsList error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลข่าวสารได้',
      detail: error.message,
    });
  }
}

/**
 * ดึงรายละเอียดข่าวรายชิ้น และนับยอดวิว (+1 viewCount)
 * GET /api/news/:id
 */
export async function getNewsById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // ค้นหาข่าวและเพิ่มยอดวิวพร้อมกันในคำสั่งเดียว
    const news = await prisma.news.update({
      where: {
        id,
        isPublished: true,
      },
      data: {
        viewCount: {
          increment: 1,
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
        coverImageUrl: true,
        category: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            fullName: true,
          },
        },
      },
    });

    res.json({
      status: 'success',
      data: news,
    });
  } catch (error: any) {
    // หากไม่พบ id หรือข่าวยังไม่ได้เผยแพร่ prisma.update จะ throw P2025
    if (error.code === 'P2025') {
      res.status(404).json({
        status: 'error',
        message: 'ไม่พบข่าวสารนี้ หรือข่าวนี้ยังไม่เปิดเผยแพร่',
      });
      return;
    }

    console.error('getNewsById error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลข่าวสารได้',
      detail: error.message,
    });
  }
}
