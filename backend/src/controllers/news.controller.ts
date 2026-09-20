import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { NewsCategory } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware.js';


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

    const [total, rawNewsList] = await Promise.all([
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
          linkUrl: true,
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

    // Check custom news order from SiteSetting
    let newsList = [...rawNewsList];
    try {
      const orderSetting = await prisma.siteSetting.findUnique({
        where: { key: 'news_order' },
      });
      if (orderSetting?.value) {
        const orderedIds: string[] = JSON.parse(orderSetting.value);
        if (Array.isArray(orderedIds) && orderedIds.length > 0) {
          newsList.sort((a, b) => {
            const indexA = orderedIds.indexOf(a.id);
            const indexB = orderedIds.indexOf(b.id);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        }
      }
    } catch (e) {
      console.warn('Failed to sort news by news_order:', e);
    }

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

/**
 * สร้างข่าวสารใหม่ (เฉพาะ SUPER_ADMIN)
 * POST /api/news
 */
export async function createNews(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { title, content, coverImageUrl, category, linkUrl } = req.body;
    if (!title || !content) {
      res.status(400).json({
        status: 'error',
        message: 'กรุณากรอกหัวข้อข่าวและเนื้อหาข่าว',
      });
      return;
    }

    const news = await prisma.news.create({
      data: {
        title,
        content,
        coverImageUrl: coverImageUrl || null,
        linkUrl: linkUrl || null,
        category: category && Object.values(NewsCategory).includes(category) ? category : NewsCategory.ANNOUNCEMENT,
        isPublished: true,
        authorId: req.user?.userId,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'สร้างข่าวสารสำเร็จ',
      data: news,
    });
  } catch (error: any) {
    console.error('createNews error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถสร้างข่าวสารได้',
      detail: error.message,
    });
  }
}

/**
 * แก้ไขข่าวสาร (เฉพาะ SUPER_ADMIN)
 * PUT /api/news/:id
 */
export async function updateNews(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, content, coverImageUrl, category, linkUrl } = req.body;

    if (!title || !content) {
      res.status(400).json({
        status: 'error',
        message: 'กรุณากรอกหัวข้อข่าวและเนื้อหาข่าว',
      });
      return;
    }

    const updatedNews = await prisma.news.update({
      where: { id },
      data: {
        title,
        content,
        coverImageUrl: coverImageUrl !== undefined ? coverImageUrl : undefined,
        linkUrl: linkUrl !== undefined ? (linkUrl || null) : undefined,
        ...(category && Object.values(NewsCategory).includes(category) ? { category } : {}),
      },
    });

    res.json({
      status: 'success',
      message: 'แก้ไขข้อมูลข่าวสารเรียบร้อยแล้ว',
      data: updatedNews,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({
        status: 'error',
        message: 'ไม่พบข่าวสารที่ต้องการแก้ไข',
      });
      return;
    }
    console.error('updateNews error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถแก้ไขข่าวสารได้',
      detail: error.message,
    });
  }
}

/**
 * ลบข่าวสาร (เฉพาะ SUPER_ADMIN)
 * DELETE /api/news/:id
 */
export async function deleteNews(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.news.delete({
      where: { id },
    });

    res.json({
      status: 'success',
      message: 'ลบข่าวสารเรียบร้อยแล้ว',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({
        status: 'error',
        message: 'ไม่พบข่าวสารที่ต้องการลบ',
      });
      return;
    }
    console.error('deleteNews error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถลบข่าวสารได้',
      detail: error.message,
    });
  }
}

/**
 * ปรับลำดับการแสดงผลของข่าวสาร (เฉพาะ SUPER_ADMIN)
 * PUT /api/news/reorder
 */
export async function reorderNews(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({
        status: 'error',
        message: 'กรุณาระบุ orderedIds เป็นอาร์เรย์ของ ID ข่าวสาร',
      });
      return;
    }

    await prisma.siteSetting.upsert({
      where: { key: 'news_order' },
      update: { value: JSON.stringify(orderedIds) },
      create: {
        key: 'news_order',
        value: JSON.stringify(orderedIds),
        description: 'ลำดับการแสดงผลของข่าวสาร',
      },
    });

    res.json({
      status: 'success',
      message: 'ปรับปรุงลำดับการแสดงผลข่าวสารสำเร็จ',
      data: orderedIds,
    });
  } catch (error: any) {
    console.error('reorderNews error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถปรับลำดับข่าวสารได้',
      detail: error.message,
    });
  }
}

/**
 * เพิ่มยอดเข้าชมข่าวสาร (+1 viewCount)
 * PATCH /api/news/:id/view
 */
export async function incrementNewsView(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const news = await prisma.news.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
      select: {
        id: true,
        viewCount: true,
      },
    });

    res.json({
      status: 'success',
      data: news,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({
        status: 'error',
        message: 'ไม่พบข่าวสารที่ต้องการเพิ่มยอดวิว',
      });
      return;
    }
    console.error('incrementNewsView error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถเพิ่มยอดวิวได้',
    });
  }
}


