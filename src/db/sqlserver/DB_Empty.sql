
USE [DB_Empty]
GO
/****** Object:  Table [dbo].[Empty_Test]    Script Date: 2023/6/6 20:47:58 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Empty_Test](
	[name] [int] NULL
) ON [PRIMARY]

GO
USE [master]
GO
ALTER DATABASE [DB_Empty] SET  READ_WRITE 
GO
